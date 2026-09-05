"""
Service logic for Budget projections, ledger performance calculations, and revision lineage (Phase 6, P1).
"""

import math
from datetime import datetime, timezone
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, and_

from app.models.budget import Budget
from app.models.analytic_account import AnalyticAccount
from app.models.contact import Contact
from app.models.vendor_bill import VendorBill, VendorBillLine
from app.models.customer_invoice import CustomerInvoice, CustomerInvoiceLine
from app.schemas.budget import BudgetCreate, BudgetRevise, BudgetResponse
from app.core.exceptions import (
    NotFoundException,
    ValidationException,
    InvalidStatusTransitionException,
)


# Aggregates actual financial consumption or revenue generation from the ledger for an analytic account
def get_achieved_amount(
    db: Session,
    analytic_account_id: int,
    period_start: datetime,
    period_end: datetime,
    budget_type: str = "expense",
) -> float:
    """
    Calculate actual spend or income tagged to an analytic account during a date window:
    - Expenses: sum subtotals from VendorBillLines where parent bill is not cancelled.
    - Income: sum subtotals from CustomerInvoiceLines where parent invoice is not cancelled.
    """
    if budget_type == "expense":
        # 'coalesce' returns fallback 0.0 when no matching bill lines exist
        stmt = (
            select(func.coalesce(func.sum(VendorBillLine.subtotal), 0.0))
            .join(VendorBill, VendorBillLine.bill_id == VendorBill.id)
            .where(
                VendorBillLine.analytic_account_id == analytic_account_id,
                VendorBill.bill_date >= period_start,
                VendorBill.bill_date <= period_end,
                VendorBill.status != "cancelled",
            )
        )
    else:  # income
        stmt = (
            select(func.coalesce(func.sum(CustomerInvoiceLine.subtotal), 0.0))
            .join(CustomerInvoice, CustomerInvoiceLine.invoice_id == CustomerInvoice.id)
            .where(
                CustomerInvoiceLine.analytic_account_id == analytic_account_id,
                CustomerInvoice.invoice_date >= period_start,
                CustomerInvoice.invoice_date <= period_end,
                CustomerInvoice.status != "cancelled",
            )
        )

    # 'scalar' retrieves the single computed numeric aggregation
    raw_amount = db.scalar(stmt) or 0.0
    return round(float(raw_amount), 2)


# Formats a Budget ORM model into a BudgetResponse schema with dynamically derived metrics
def build_budget_response(db: Session, budget: Budget) -> BudgetResponse:
    """
    Enrich budget entity with real-time computed performance statistics:
    - achieved_amount: actual billed expenses or invoiced income
    - achieved_pct: percentage of committed target reached
    - amount_to_achieve: remaining committed headroom or deficit
    """
    acc_type = budget.analytic_account.type if budget.analytic_account else "expense"
    achieved = get_achieved_amount(
        db,
        analytic_account_id=budget.analytic_account_id,
        period_start=budget.period_start,
        period_end=budget.period_end,
        budget_type=acc_type,
    )

    committed = round(budget.committed_amount, 2)
    # 'round' avoids IEEE 754 floating point arithmetic drift
    achieved_pct = round((achieved / committed) * 100, 2) if committed > 0 else 0.0
    amount_to_achieve = round(committed - achieved, 2)

    return BudgetResponse(
        id=budget.id,
        name=budget.name,
        analytic_account_id=budget.analytic_account_id,
        analytic_account_name=budget.analytic_account.name if budget.analytic_account else None,
        analytic_account_type=acc_type,
        period_start=budget.period_start,
        period_end=budget.period_end,
        committed_amount=committed,
        status=budget.status,
        responsible_person_id=budget.responsible_person_id,
        responsible_person_name=budget.responsible_person.name if budget.responsible_person else None,
        revised_from_id=budget.revised_from_id,
        created_at=budget.created_at,
        updated_at=budget.updated_at,
        achieved_amount=achieved,
        achieved_pct=achieved_pct,
        amount_to_achieve=amount_to_achieve,
    )


# Evaluates if adding new spending or income would breach an active confirmed budget allocation
def check_budget_exceeded(
    db: Session,
    analytic_account_id: int,
    new_amount: float,
    reference_date: Optional[datetime] = None,
) -> Optional[str]:
    """
    Informational budget check for PO/Vendor Bill or Sales Order confirmations.
    Returns a human-readable warning string if active budget committed limit is exceeded.
    """
    ref = reference_date or datetime.now(timezone.utc)
    # Locate active confirmed budget spanning the target transaction date
    stmt = (
        select(Budget)
        .options(joinedload(Budget.analytic_account))
        .where(
            Budget.analytic_account_id == analytic_account_id,
            Budget.status == "confirmed",
            Budget.period_start <= ref,
            Budget.period_end >= ref,
        )
    )
    budget = db.scalar(stmt)
    if not budget:
        return None

    current_achieved = get_achieved_amount(
        db,
        analytic_account_id=analytic_account_id,
        period_start=budget.period_start,
        period_end=budget.period_end,
        budget_type=budget.analytic_account.type if budget.analytic_account else "expense",
    )

    projected_total = round(current_achieved + new_amount, 2)
    if projected_total > budget.committed_amount:
        overrun = round(projected_total - budget.committed_amount, 2)
        return (
            f"Budget '{budget.name}' committed limit of INR {budget.committed_amount:,.2f} "
            f"will be exceeded by INR {overrun:,.2f} (Projected: INR {projected_total:,.2f})"
        )
    return None


# Creates a new draft Budget after validating analytic account existence and avoiding date overlaps
def create_budget(db: Session, req: BudgetCreate) -> BudgetResponse:
    """
    Create a new Budget record in 'draft' status.
    Ensures analytic account and responsible person exist, and prevents overlapping active budgets.
    """
    account = db.get(AnalyticAccount, req.analytic_account_id)
    if not account:
        raise NotFoundException("Analytic Account", req.analytic_account_id)

    if req.responsible_person_id is not None:
        contact = db.get(Contact, req.responsible_person_id)
        if not contact:
            raise NotFoundException("Contact", req.responsible_person_id)

    # Check for overlapping active (draft or confirmed) budgets for the same analytic account
    overlapping = db.scalar(
        select(Budget).where(
            Budget.analytic_account_id == req.analytic_account_id,
            Budget.status.in_(["draft", "confirmed"]),
            and_(
                Budget.period_start < req.period_end,
                Budget.period_end > req.period_start,
            ),
        )
    )
    if overlapping:
        raise ValidationException(
            f"An active budget '{overlapping.name}' ({overlapping.status}) already overlaps with the requested period"
        )

    if req.period_end <= req.period_start:
        raise ValidationException("period_end must be chronologically after period_start")

    budget = Budget(
        name=req.name.strip(),
        analytic_account_id=req.analytic_account_id,
        period_start=req.period_start,
        period_end=req.period_end,
        committed_amount=round(req.committed_amount, 2),
        status="draft",
        responsible_person_id=req.responsible_person_id,
    )
    db.add(budget)
    try:
        # 'commit' persists the new draft budget
        db.commit()
    except Exception:
        # 'rollback' ensures no partial or detached budget entity remains in the session
        db.rollback()
        raise
    # 'refresh' synchronizes the in-memory entity with generated database defaults
    db.refresh(budget)
    return build_budget_response(db, budget)


# Confirms a draft Budget activating it for operational tracking and variance analysis
def confirm_budget(db: Session, budget_id: int) -> BudgetResponse:
    """
    Transition Budget from 'draft' -> 'confirmed'.
    """
    budget = db.scalar(
        select(Budget)
        .options(joinedload(Budget.analytic_account), joinedload(Budget.responsible_person))
        .where(Budget.id == budget_id)
    )
    if not budget:
        raise NotFoundException("Budget", budget_id)

    if budget.status != "draft":
        raise InvalidStatusTransitionException(f"Cannot confirm budget with status '{budget.status}'")

    budget.status = "confirmed"
    try:
        # 'commit' applies status confirmation
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(budget)
    return build_budget_response(db, budget)


# Creates a formal revision row branching off an existing confirmed Budget
def revise_budget(db: Session, budget_id: int, req: BudgetRevise) -> BudgetResponse:
    """
    Create a revised Budget from a confirmed budget:
    - Sets current confirmed budget to 'revised'
    - Creates a new confirmed Budget referencing the parent via revised_from_id
    - Enforces lineage invariants (cannot revise draft, cancelled, or already-revised budgets)
    """
    original = db.scalar(
        select(Budget)
        .options(joinedload(Budget.analytic_account))
        .where(Budget.id == budget_id)
    )
    if not original:
        raise NotFoundException("Budget", budget_id)

    if original.status == "draft":
        raise ValidationException("Cannot revise a draft budget; confirm it first before revising")
    if original.status == "revised":
        raise ValidationException("This budget has already been revised; revisions must branch from the latest active budget")
    if original.status == "cancelled":
        raise ValidationException("Cannot revise a cancelled budget")
    if original.status != "confirmed":
        raise InvalidStatusTransitionException(f"Cannot revise budget in status '{original.status}'")

    # Mark parent budget as historical revision
    original.status = "revised"

    # Instantiate new active revision
    revision_title = req.name.strip() if req.name else f"{original.name} (Rev)"
    resp_person_id = req.responsible_person_id if req.responsible_person_id is not None else original.responsible_person_id

    revised_budget = Budget(
        name=revision_title,
        analytic_account_id=original.analytic_account_id,
        period_start=original.period_start,
        period_end=original.period_end,
        committed_amount=round(req.committed_amount, 2),
        status="confirmed",
        responsible_person_id=resp_person_id,
        revised_from_id=original.id,
    )
    db.add(revised_budget)
    try:
        # 'commit' atomically updates parent status and inserts child revision
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(revised_budget)
    return build_budget_response(db, revised_budget)


# Cancels an unconfirmed draft Budget
def cancel_budget(db: Session, budget_id: int) -> BudgetResponse:
    """
    Transition draft Budget to 'cancelled'. Confirmed budgets cannot be cancelled directly.
    """
    budget = db.scalar(
        select(Budget)
        .options(joinedload(Budget.analytic_account), joinedload(Budget.responsible_person))
        .where(Budget.id == budget_id)
    )
    if not budget:
        raise NotFoundException("Budget", budget_id)

    if budget.status != "draft":
        raise ValidationException(f"Only draft budgets can be cancelled, current status is '{budget.status}'")

    budget.status = "cancelled"
    try:
        # 'commit' marks budget cancelled
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(budget)
    return build_budget_response(db, budget)


# Fetches a single Budget by primary key ID along with computed metrics
def get_budget(db: Session, budget_id: int) -> BudgetResponse:
    """
    Retrieve single budget details with computed metrics.
    """
    # 'joinedload' performs eager SQL LEFT OUTER JOIN to eliminate N+1 select queries
    stmt = (
        select(Budget)
        .options(joinedload(Budget.analytic_account), joinedload(Budget.responsible_person))
        .where(Budget.id == budget_id)
    )
    budget = db.scalar(stmt)
    if not budget:
        raise NotFoundException("Budget", budget_id)
    return build_budget_response(db, budget)


# Lists paginated Budgets with optional filtering by analytic account, status, and title search
def list_budgets(
    db: Session,
    analytic_account_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[BudgetResponse], int, int, int, int]:
    """
    Query budgets with filtering, pagination, and real-time metric derivation.
    """
    stmt = (
        select(Budget)
        .options(joinedload(Budget.analytic_account), joinedload(Budget.responsible_person))
    )

    if analytic_account_id is not None:
        stmt = stmt.where(Budget.analytic_account_id == analytic_account_id)

    if status:
        stmt = stmt.where(Budget.status == status.lower())

    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(Budget.name.ilike(pattern))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    stmt = stmt.order_by(Budget.created_at.desc())
    offset = (page - 1) * limit
    budgets = db.scalars(stmt.offset(offset).limit(limit)).unique().all()

    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1
    data = [build_budget_response(db, b) for b in budgets]

    return data, total, page, limit, pages
