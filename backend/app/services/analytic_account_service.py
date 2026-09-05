"""
Service logic for Analytic Accounts cost and revenue centre management (Phase 6, P1).
"""

import math
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_

from app.models.analytic_account import AnalyticAccount
from app.schemas.analytic_account import AnalyticAccountCreate, AnalyticAccountUpdate
from app.core.exceptions import NotFoundException, ConflictException


# Creates a new Analytic Account ensuring uniqueness of the alphanumeric cost centre code
def create_analytic_account(db: Session, req: AnalyticAccountCreate) -> AnalyticAccount:
    """
    Register a new cost/revenue centre in the database.
    Rejects duplicate codes with a ConflictException.
    """
    clean_code = req.code.strip().upper()
    # 'scalar' queries for single row existence without fetching full collection
    existing = db.scalar(select(AnalyticAccount).where(func.upper(AnalyticAccount.code) == clean_code))
    if existing:
        raise ConflictException(code="DUPLICATE_ANALYTIC_CODE", message=f"Analytic Account with code '{clean_code}' already exists")

    account = AnalyticAccount(
        code=clean_code,
        name=req.name.strip(),
        type=req.type,
        description=req.description,
        is_active=True,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


# Retrieves an Analytic Account by primary key ID or raises NotFoundException
def get_analytic_account(db: Session, account_id: int) -> AnalyticAccount:
    """
    Fetch a single Analytic Account by primary key.
    """
    # 'get' performs direct identity-map cache lookup on the primary key
    account = db.get(AnalyticAccount, account_id)
    if not account:
        raise NotFoundException("Analytic Account", account_id)
    return account


# Lists paginated Analytic Accounts with optional filtering by type, search, and active state
def list_analytic_accounts(
    db: Session,
    account_type: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[AnalyticAccount], int, int, int, int]:
    """
    Query Analytic Accounts with pagination, case-insensitive substring matching, and filtering.
    """
    stmt = select(AnalyticAccount)

    if account_type:
        stmt = stmt.where(AnalyticAccount.type == account_type.lower())

    if is_active is not None:
        stmt = stmt.where(AnalyticAccount.is_active == is_active)

    if search:
        pattern = f"%{search.strip()}%"
        # 'or_' combines multiple column filter criteria with SQL OR conjunction
        stmt = stmt.where(or_(AnalyticAccount.name.ilike(pattern), AnalyticAccount.code.ilike(pattern)))

    # Compute total matching count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Apply deterministic sorting and pagination offsets
    stmt = stmt.order_by(AnalyticAccount.code.asc())
    offset = (page - 1) * limit
    items = db.scalars(stmt.offset(offset).limit(limit)).all()
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1

    return list(items), total, page, limit, pages


# Updates an existing Analytic Account metadata or toggles active status
def update_analytic_account(db: Session, account_id: int, req: AnalyticAccountUpdate) -> AnalyticAccount:
    """
    Update fields on an Analytic Account. Checks for code collisions if code is modified.
    """
    account = get_analytic_account(db, account_id)

    if req.code is not None:
        clean_code = req.code.strip().upper()
        if clean_code != account.code:
            existing = db.scalar(
                select(AnalyticAccount).where(
                    func.upper(AnalyticAccount.code) == clean_code,
                    AnalyticAccount.id != account_id,
                )
            )
            if existing:
                raise ConflictException(code="DUPLICATE_ANALYTIC_CODE", message=f"Code '{clean_code}' is already in use")
            account.code = clean_code

    if req.name is not None:
        account.name = req.name.strip()
    if req.type is not None:
        account.type = req.type
    if req.description is not None:
        account.description = req.description
    if req.is_active is not None:
        account.is_active = req.is_active

    db.commit()
    db.refresh(account)
    return account
