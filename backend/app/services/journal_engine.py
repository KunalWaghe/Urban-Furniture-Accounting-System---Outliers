"""
Core Journal Entry posting engine enforcing double-entry balance and ledger integrity (P0-BE-06, P0-BE-11).
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.journal_entry import JournalEntry, JournalItem
from app.models.journal import Journal
from app.models.account import Account
from app.core.exceptions import ValidationException, NotFoundException


# Generates a sequentially ordered journal entry reference number like JE-0001
def generate_je_number(db: Session) -> str:
    count = db.scalar(select(func.count(JournalEntry.id))) or 0
    return f"JE-{(count + 1):04d}"


# Validates debit/credit balancing, non-negativity, and verifies all account IDs exist
def validate_journal_lines(db: Session, lines: List[Dict[str, Any]]) -> float:
    if not lines or len(lines) < 2:
        raise ValidationException("A journal entry requires at least two line items to balance debits and credits")

    # Fetch unique account IDs in one batch query for optimal database efficiency
    # 'set' keyword is used here to eliminate duplicate account IDs before querying the database
    account_ids = set(line.get("account_id") for line in lines if line.get("account_id"))
    existing_accounts = db.scalars(select(Account.id).where(Account.id.in_(account_ids))).all()
    # 'set' keyword is used here for O(1) membership lookup speed when checking each line's account
    existing_account_ids = set(existing_accounts)

    total_debit = 0.0
    total_credit = 0.0

    for idx, line in enumerate(lines, start=1):
        account_id = line.get("account_id")
        if not account_id or account_id not in existing_account_ids:
            raise ValidationException(f"Line {idx}: Account ID {account_id} does not exist or is missing")

        debit = float(line.get("debit") or 0.0)
        credit = float(line.get("credit") or 0.0)

        if debit < 0 or credit < 0:
            raise ValidationException(f"Line {idx}: Debit and credit amounts cannot be negative")

        if debit == 0.0 and credit == 0.0:
            raise ValidationException(f"Line {idx}: Line must contain either a non-zero debit or credit amount")

        if debit > 0.0 and credit > 0.0:
            raise ValidationException(f"Line {idx}: Line cannot have both debit and credit amounts simultaneously")

        total_debit += debit
        total_credit += credit

    rounded_debit = round(total_debit, 2)
    rounded_credit = round(total_credit, 2)

    if rounded_debit != rounded_credit:
        raise ValidationException(
            f"Unbalanced journal entry: Total debits ({rounded_debit:.2f}) must equal total credits ({rounded_credit:.2f})"
        )

    return rounded_debit


# Creates, validates, and posts a balanced double-entry journal record into the ledger
def post_journal_entry(
    db: Session,
    journal_code: str,
    reference: Optional[str] = None,
    entry_date: Optional[datetime] = None,
    lines: Optional[List[Dict[str, Any]]] = None,
    is_posted: bool = True,
) -> JournalEntry:
    if not lines:
        raise ValidationException("Cannot post a journal entry without line items")

    # Locate journal by code (e.g., 'PUR', 'SLS', 'BNK', 'CSH') or fallback to type
    journal = db.scalar(select(Journal).where(Journal.code == journal_code.upper()))
    if not journal:
        journal = db.scalar(select(Journal).where(Journal.type == journal_code.lower()))
    if not journal:
        raise NotFoundException(f"Journal with code or type '{journal_code}' not found")

    # Validate debit and credit integrity across all lines
    total_amount = validate_journal_lines(db, lines)

    # Determine posting timestamp and sequential identifier
    date_to_use = entry_date or datetime.now(timezone.utc)
    entry_number = generate_je_number(db)

    # Instantiate journal entry header
    journal_entry = JournalEntry(
        entry_number=entry_number,
        journal_id=journal.id,
        reference=reference,
        date=date_to_use,
        total_amount=total_amount,
        is_posted=is_posted,
    )
    db.add(journal_entry)
    # 'flush' keyword is used here to write changes to transaction and generate journal_entry.id without ending transaction
    db.flush()

    # Append validated ledger line items
    for line in lines:
        item = JournalItem(
            journal_entry_id=journal_entry.id,
            account_id=line["account_id"],
            partner_id=line.get("partner_id"),
            debit=round(float(line.get("debit") or 0.0), 2),
            credit=round(float(line.get("credit") or 0.0), 2),
            description=line.get("description"),
            analytic_account_id=line.get("analytic_account_id"),
        )
        db.add(item)

    # 'flush' keyword is used here to persist line items to the database session so caller can query them immediately
    db.flush()
    return journal_entry
