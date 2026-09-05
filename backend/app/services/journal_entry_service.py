"""
Service layer for Journal Entries querying, retrieval, and manual creation (P0-BE-11).
"""

import math
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_, desc, asc

from app.models.journal_entry import JournalEntry, JournalItem
from app.models.journal import Journal
from app.schemas.journal_entry import (
    JournalEntryCreate,
    JournalEntryResponse,
    JournalItemResponse,
)
from app.services.journal_engine import post_journal_entry
from app.core.exceptions import NotFoundException


# Converts a JournalEntry ORM model into a serialized Pydantic response schema
def build_journal_entry_response(je: JournalEntry) -> JournalEntryResponse:
    items_resp = []
    if je.items:
        for it in je.items:
            items_resp.append(
                JournalItemResponse(
                    account_id=it.account_id,
                    account_name=it.account.name if it.account else None,
                    account_code=it.account.code if it.account else None,
                    partner_id=it.partner_id,
                    debit=it.debit,
                    credit=it.credit,
                    description=it.description,
                    analytic_account_id=it.analytic_account_id,
                )
            )

    return JournalEntryResponse(
        id=je.id,
        entry_number=je.entry_number,
        journal_code=je.journal.code if je.journal else None,
        journal_name=je.journal.name if je.journal else None,
        date=je.date,
        reference=je.reference,
        total_amount=je.total_amount,
        is_posted=je.is_posted,
        items=items_resp,
    )


# Creates and posts a manual double-entry journal transaction from validated user input
def create_manual_journal_entry(db: Session, payload: JournalEntryCreate) -> JournalEntryResponse:
    # Convert Pydantic items into dictionary payloads expected by post_journal_entry
    lines = [item.model_dump() for item in payload.items]

    # Post balanced entry using the core journal engine
    created_entry = post_journal_entry(
        db=db,
        journal_code=payload.journal_code,
        reference=payload.reference,
        entry_date=payload.date,
        lines=lines,
        is_posted=True,
    )
    try:
        # 'commit' atomically writes manual journal header and lines to the general ledger
        db.commit()
    except Exception:
        # 'rollback' ensures an unbalanced or erroneous transaction does not pollute the session
        db.rollback()
        raise

    # Reload with all relationships populated
    entry = db.scalar(
        select(JournalEntry)
        # 'joinedload' keyword is used here to eagerly load foreign relationships in SQL JOINs to prevent N+1 queries
        .options(
            joinedload(JournalEntry.journal),
            joinedload(JournalEntry.items).joinedload(JournalItem.account),
            joinedload(JournalEntry.items).joinedload(JournalItem.partner),
        )
        .where(JournalEntry.id == created_entry.id)
    )

    return build_journal_entry_response(entry)


# Retrieves an individual journal entry by its primary key
def get_journal_entry_by_id(db: Session, entry_id: int) -> JournalEntryResponse:
    entry = db.scalar(
        select(JournalEntry)
        # 'joinedload' keyword is used here to eagerly load foreign relationships in SQL JOINs to prevent N+1 queries
        .options(
            joinedload(JournalEntry.journal),
            joinedload(JournalEntry.items).joinedload(JournalItem.account),
            joinedload(JournalEntry.items).joinedload(JournalItem.partner),
        )
        .where(JournalEntry.id == entry_id)
    )
    if not entry:
        raise NotFoundException("JournalEntry", entry_id)

    return build_journal_entry_response(entry)


JE_SORT_MAP = {
    "date": JournalEntry.date,
    "entry_number": JournalEntry.entry_number,
    "total_amount": JournalEntry.total_amount,
    "created_at": JournalEntry.created_at,
    "id": JournalEntry.id,
}


# Fetches a paginated, filtered, and sorted list of journal entries from the general ledger
def list_journal_entries(
    db: Session,
    journal_id: Optional[int] = None,
    journal_code: Optional[str] = None,
    is_posted: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "date",
    sort_order: str = "desc",
) -> Tuple[List[JournalEntryResponse], int, int, int, int]:
    count_stmt = select(func.count(JournalEntry.id))

    if journal_id:
        count_stmt = count_stmt.where(JournalEntry.journal_id == journal_id)
    if journal_code:
        count_stmt = count_stmt.join(JournalEntry.journal).where(Journal.code == journal_code.upper())
    if is_posted is not None:
        count_stmt = count_stmt.where(JournalEntry.is_posted == is_posted)
    if start_date:
        count_stmt = count_stmt.where(JournalEntry.date >= start_date)
    if end_date:
        count_stmt = count_stmt.where(JournalEntry.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        # 'ilike' keyword is used here for case-insensitive pattern matching across reference and entry number
        count_stmt = count_stmt.where(
            or_(
                JournalEntry.entry_number.ilike(search_pattern),
                JournalEntry.reference.ilike(search_pattern),
            )
        )

    total = db.scalar(count_stmt) or 0

    stmt = select(JournalEntry).options(
        # 'joinedload' keyword is used here to eagerly load foreign relationships in SQL JOINs to prevent N+1 queries
        joinedload(JournalEntry.journal),
        joinedload(JournalEntry.items).joinedload(JournalItem.account),
        joinedload(JournalEntry.items).joinedload(JournalItem.partner),
    )

    if journal_id:
        stmt = stmt.where(JournalEntry.journal_id == journal_id)
    if journal_code:
        stmt = stmt.join(JournalEntry.journal).where(Journal.code == journal_code.upper())
    if is_posted is not None:
        stmt = stmt.where(JournalEntry.is_posted == is_posted)
    if start_date:
        stmt = stmt.where(JournalEntry.date >= start_date)
    if end_date:
        stmt = stmt.where(JournalEntry.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        # 'ilike' keyword is used here for case-insensitive pattern matching across reference and entry number
        stmt = stmt.where(
            or_(
                JournalEntry.entry_number.ilike(search_pattern),
                JournalEntry.reference.ilike(search_pattern),
            )
        )

    sort_col = JE_SORT_MAP.get(sort_by, JournalEntry.date)
    order_func = desc if sort_order.lower() == "desc" else asc
    stmt = stmt.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    # 'unique' keyword is used here to deduplicate parent JournalEntry rows returned by joined collections
    entries = db.scalars(stmt).unique().all()
    responses = [build_journal_entry_response(e) for e in entries]
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1

    return responses, total, page, limit, pages
