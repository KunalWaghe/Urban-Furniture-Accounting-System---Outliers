"""
Service logic for Chart of Accounts and Journals, including auto-seeding (P0-BE-04).
"""

from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.account import Account
from app.models.journal import Journal
from app.schemas.account import AccountCreate, AccountUpdate
from app.schemas.journal import JournalResponse
from app.core.exceptions import NotFoundException, ConflictException, ValidationException

VALID_ACCOUNT_TYPES = {"asset", "liability", "capital", "income", "expense", "other_expense"}

# Default seeded Chart of Accounts covering all 5 account types
DEFAULT_ACCOUNTS = [
    {"code": "1010", "name": "Cash", "type": "asset", "description": "Main Cash balance"},
    {"code": "1020", "name": "Bank Account", "type": "asset", "description": "Primary Bank account"},
    {"code": "1030", "name": "Accounts Receivable (Debtors)", "type": "asset", "description": "Trade Debtors"},
    {"code": "2010", "name": "Accounts Payable (Creditors)", "type": "liability", "description": "Trade Creditors"},
    {"code": "2020", "name": "Tax Payable", "type": "liability", "description": "Output tax / GST payable"},
    {"code": "3010", "name": "Owner Capital", "type": "capital", "description": "Owner Equity & Capital"},
    {"code": "3999", "name": "Retained Earnings", "type": "capital", "description": "Accumulated net earnings and retained profits"},
    {"code": "4010", "name": "Sales Income", "type": "income", "description": "Revenue from furniture sales"},
    {"code": "5010", "name": "Purchase Expense", "type": "expense", "description": "Cost of goods purchased"},
]

# Default seeded Journals with target default account code
DEFAULT_JOURNALS_CONFIG = [
    {"code": "SLS", "name": "Sales Journal", "type": "sale", "account_code": "4010"},
    {"code": "PUR", "name": "Purchase Journal", "type": "purchase", "account_code": "5010"},
    {"code": "BNK", "name": "Bank Journal", "type": "bank", "account_code": "1020"},
    {"code": "CSH", "name": "Cash Journal", "type": "cash", "account_code": "1010"},
]

# Module-level flag to avoid re-seeding on every request
_seeded = False


def _escape_like(s: str) -> str:
    """Escape LIKE wildcard characters to prevent search manipulation."""
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def seed_accounting_defaults(db: Session, force: bool = False) -> None:
    """Ensure default Chart of Accounts and Journals are present in the database."""
    global _seeded
    if _seeded and not force:
        return

    # 1. Seed Accounts if missing
    existing_accounts = {acc.code: acc for acc in db.query(Account).all()}
    accounts_added = False
    for item in DEFAULT_ACCOUNTS:
        if item["code"] not in existing_accounts:
            acc = Account(**item)
            db.add(acc)
            accounts_added = True

    if accounts_added:
        db.commit()
        existing_accounts = {acc.code: acc for acc in db.query(Account).all()}

    # 2. Seed Journals if missing and map default_account_id
    existing_journals = {j.code: j for j in db.query(Journal).all()}
    journals_added = False
    for cfg in DEFAULT_JOURNALS_CONFIG:
        code = cfg["code"]
        target_account = existing_accounts.get(cfg["account_code"])
        account_id = target_account.id if target_account else None

        if code not in existing_journals:
            j = Journal(
                code=code,
                name=cfg["name"],
                type=cfg["type"],
                default_account_id=account_id,
            )
            db.add(j)
            journals_added = True
        elif existing_journals[code].default_account_id is None and account_id:
            existing_journals[code].default_account_id = account_id
            journals_added = True

    if journals_added:
        db.commit()

    _seeded = True


import math
from sqlalchemy import asc, desc

ACCOUNT_SORT_MAP = {
    "code": Account.code,
    "name": Account.name,
    "type": Account.type,
    "id": Account.id,
}

JOURNAL_SORT_MAP = {
    "code": Journal.code,
    "name": Journal.name,
    "type": Journal.type,
    "id": Journal.id,
}


def get_accounts(
    db: Session,
    account_type: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "code",
    sort_order: str = "asc",
) -> Tuple[List[Account], int, int, int, int]:
    """Retrieve chart of accounts with optional filtering, sorting, and pagination."""
    seed_accounting_defaults(db)

    query = db.query(Account)
    if account_type:
        query = query.filter(Account.type.ilike(f"%{_escape_like(account_type)}%"))
    if search:
        pattern = f"%{_escape_like(search)}%"
        query = query.filter((Account.name.ilike(pattern)) | (Account.code.ilike(pattern)))
    if is_active is not None:
        query = query.filter(Account.is_active == is_active)

    total = query.count()
    sort_col = ACCOUNT_SORT_MAP.get(sort_by, Account.code)
    order_func = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    accounts = query.offset(offset).limit(limit).all()
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1
    return accounts, total, page, limit, pages


def get_account_by_id(db: Session, account_id: int) -> Account:
    """Fetch a single ledger account by primary key."""
    seed_accounting_defaults(db)
    account = db.get(Account, account_id)
    if not account:
        raise NotFoundException("Account", account_id)
    return account


def create_account(db: Session, req: AccountCreate) -> Account:
    """Create a new ledger account with a unique code."""
    seed_accounting_defaults(db)

    account_type = req.type.lower()
    if account_type not in VALID_ACCOUNT_TYPES:
        raise ValidationException(
            f"Invalid account type '{req.type}'. Must be one of: {', '.join(sorted(VALID_ACCOUNT_TYPES))}"
        )

    clean_code = req.code.strip()
    existing = db.scalar(select(Account).where(func.upper(Account.code) == clean_code.upper()))
    if existing:
        raise ConflictException(code="DUPLICATE_ACCOUNT_CODE", message=f"Account code '{clean_code}' already exists")

    account = Account(
        code=clean_code,
        name=req.name.strip(),
        type=account_type,
        description=req.description.strip() if req.description else None,
        is_active=True,
    )
    db.add(account)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(account)
    return account


def update_account(db: Session, account_id: int, req: AccountUpdate) -> Account:
    """Update ledger account metadata or active status."""
    account = get_account_by_id(db, account_id)

    if req.type is not None:
        account_type = req.type.lower()
        if account_type not in VALID_ACCOUNT_TYPES:
            raise ValidationException(
                f"Invalid account type '{req.type}'. Must be one of: {', '.join(sorted(VALID_ACCOUNT_TYPES))}"
            )
        account.type = account_type

    if req.code is not None:
        clean_code = req.code.strip()
        if clean_code.upper() != account.code.upper():
            existing = db.scalar(
                select(Account).where(
                    func.upper(Account.code) == clean_code.upper(),
                    Account.id != account_id,
                )
            )
            if existing:
                raise ConflictException(code="DUPLICATE_ACCOUNT_CODE", message=f"Account code '{clean_code}' already exists")
            account.code = clean_code

    if req.name is not None:
        account.name = req.name.strip()
    if req.description is not None:
        account.description = req.description.strip() if req.description else None
    if req.is_active is not None:
        account.is_active = req.is_active

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(account)
    return account


def delete_account(db: Session, account_id: int) -> None:
    """Soft-delete a ledger account by setting is_active=False."""
    account = get_account_by_id(db, account_id)
    try:
        account.is_active = False
        db.commit()
    except Exception:
        db.rollback()
        raise


def get_journals(
    db: Session,
    journal_type: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "code",
    sort_order: str = "asc",
) -> Tuple[List[JournalResponse], int, int, int, int]:
    """Retrieve journals with optional filtering, sorting, and pagination."""
    seed_accounting_defaults(db)

    query = db.query(Journal)
    if journal_type:
        query = query.filter(Journal.type.ilike(f"%{journal_type}%"))
    if search:
        pattern = f"%{search}%"
        query = query.filter((Journal.name.ilike(pattern)) | (Journal.code.ilike(pattern)))
    if is_active is not None:
        query = query.filter(Journal.is_active == is_active)

    total = query.count()
    sort_col = JOURNAL_SORT_MAP.get(sort_by, Journal.code)
    order_func = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    journals_raw = query.offset(offset).limit(limit).all()

    journals_response = []
    for j in journals_raw:
        res = JournalResponse.model_validate(j)
        if j.default_account:
            res.default_account_name = j.default_account.name
        journals_response.append(res)

    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1
    return journals_response, total, page, limit, pages

