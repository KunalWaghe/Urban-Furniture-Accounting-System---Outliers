"""
Service logic for Vendor Bills and automated Journal Entry posting (P0-BE-06).
"""

import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_, desc, asc

from app.models.vendor_bill import VendorBill, VendorBillLine
from app.models.journal_entry import JournalEntry, JournalItem
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.account import Account
from app.models.journal import Journal
from app.models.contact import Contact
from app.schemas.vendor_bill import (
    VendorBillResponse,
    VendorBillLineResponse,
    CreateBillResponse,
)
from app.schemas.journal_entry import (
    JournalEntryResponse,
    JournalItemResponse,
)
from app.services.accounting_service import seed_accounting_defaults
from app.services.journal_engine import generate_je_number, post_journal_entry
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    InvalidStatusTransitionException,
    ValidationException,
)


# Generates a sequential bill identifier formatted as BILL-0001
def generate_bill_number(db: Session) -> str:
    count = db.scalar(select(func.count(VendorBill.id))) or 0
    return f"BILL-{(count + 1):04d}"


# Validates chronological consistency between bill issuance and payment due date
def validate_bill_dates(bill_date: datetime, due_date: Optional[datetime]) -> None:
    """
    Ensure due_date is not earlier than bill_date.
    Raises ValidationException if due_date < bill_date.
    """
    if due_date and bill_date and due_date < bill_date:
        raise ValidationException("Vendor bill due_date cannot be earlier than bill_date")


# Converts a VendorBill ORM entity into a validated Pydantic response schema
def _build_bill_response(bill: VendorBill) -> VendorBillResponse:
    lines_resp = []
    if bill.lines:
        for line in bill.lines:
            lines_resp.append(
                VendorBillLineResponse(
                    id=line.id,
                    product_id=line.product_id,
                    product_name=line.product.name if line.product else None,
                    account_id=line.account_id,
                    account_name=line.account.name if line.account else None,
                    analytic_account_id=line.analytic_account_id,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    subtotal=line.subtotal,
                )
            )

    return VendorBillResponse(
        id=bill.id,
        bill_number=bill.bill_number,
        po_id=bill.po_id,
        po_number=bill.purchase_order.po_number if bill.purchase_order else None,
        vendor_id=bill.vendor_id,
        vendor_name=bill.vendor.name if bill.vendor else None,
        bill_date=bill.bill_date,
        due_date=bill.due_date,
        total=bill.total,
        tax_percent=bill.tax_percent,
        tax_amount=bill.tax_amount,
        total_with_tax=bill.total_with_tax,
        amount_paid=bill.amount_paid,
        status=bill.status,
        journal_entry_id=bill.journal_entry_id,
        created_at=bill.created_at,
        lines=lines_resp if lines_resp else None,
    )


# Converts a JournalEntry ORM entity and its items into a Pydantic response schema
def _build_je_response(je: JournalEntry) -> JournalEntryResponse:
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
        items=items_resp,
    )


# Converts a confirmed purchase order into a vendor bill and posts the corresponding journal entry
def create_bill_from_po(db: Session, po_id: int) -> CreateBillResponse:
    # 1. Fetch Purchase Order
    po = db.scalar(
        select(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.vendor),
            joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.product),
            joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.account),
        )
        .where(PurchaseOrder.id == po_id)
    )
    if not po:
        raise NotFoundException("PurchaseOrder", po_id)

    # 2. Check if already billed or bill exists
    existing_bill = db.scalar(select(VendorBill).where(VendorBill.po_id == po_id))
    if existing_bill or po.status == "billed":
        raise ConflictException(
            code="BILL_ALREADY_EXISTS",
            message=f"A Vendor Bill already exists for Purchase Order '{po.po_number}'",
        )

    # 3. Guard status: PO must be confirmed
    if po.status != "confirmed":
        raise InvalidStatusTransitionException(
            f"Cannot create bill for Purchase Order with status '{po.status}'. PO must be confirmed."
        )

    # 4. Seed and resolve accounting master data
    seed_accounting_defaults(db)

    ap_account = db.scalar(select(Account).where(Account.code == "2010"))
    if not ap_account:
        raise ValidationException("Accounts Payable (2010) account is not configured")

    default_expense = db.scalar(select(Account).where(Account.code == "5010"))
    default_expense_id = default_expense.id if default_expense else None

    # Budget-exceeded blocking check: validate PO lines with analytic accounts against active budgets
    from app.services.budget_service import check_budget_exceeded
    budget_warnings = []
    for line in po.lines:
        if line.analytic_account_id:
            warning = check_budget_exceeded(
                db,
                analytic_account_id=line.analytic_account_id,
                new_amount=line.subtotal,
                reference_date=po.order_date,
            )
            if warning:
                budget_warnings.append(warning)

    if budget_warnings:
        raise ConflictException(
            code="BUDGET_EXCEEDED",
            message=" | ".join(budget_warnings),
        )

    bill_number = generate_bill_number(db)
    now_utc = datetime.now(timezone.utc)

    # 5. Build Journal Entry lines and post via reusable journal engine
    journal_lines = []
    for line in po.lines:
        line_account_id = line.account_id or default_expense_id
        if not line_account_id:
            raise ValidationException(f"No expense account configured for line item with product #{line.product_id}")

        journal_lines.append({
            "account_id": line_account_id,
            "partner_id": po.vendor_id,
            "debit": line.subtotal,
            "credit": 0.0,
            "description": f"Purchase of {line.product.name if line.product else 'product'}",
            "analytic_account_id": line.analytic_account_id,
        })

    # Credit Accounts Payable (Creditors) for total bill amount including tax
    bill_tax_amount = round(po.total * po.tax_percent / 100, 2) if po.tax_percent else 0.0
    bill_total_with_tax = round(po.total + bill_tax_amount, 2)

    # Debit Tax Payable (2020) for input tax if tax is applicable
    if bill_tax_amount > 0:
        tax_account = db.scalar(select(Account).where(Account.code == "2020"))
        if not tax_account:
            tax_account = db.scalar(select(Account).where(Account.name.ilike("%tax%")))
        if not tax_account:
            tax_account = db.scalar(select(Account).where(Account.type == "liability"))
        if tax_account:
            journal_lines.append({
                "account_id": tax_account.id,
                "partner_id": po.vendor_id,
                "debit": bill_tax_amount,
                "credit": 0.0,
                "description": f"Input Tax on Bill {bill_number}",
                "analytic_account_id": None,
            })

    journal_lines.append({
        "account_id": ap_account.id,
        "partner_id": po.vendor_id,
        "debit": 0.0,
        "credit": bill_total_with_tax,
        "description": f"Vendor Bill {bill_number} payable",
        "analytic_account_id": None,
    })

    # Post balanced journal entry using the unified journal engine
    journal_entry = post_journal_entry(
        db=db,
        journal_code="PUR",
        reference=bill_number,
        entry_date=now_utc,
        lines=journal_lines,
        is_posted=True,
    )

    # 6. Create Vendor Bill record with 30-day net due date terms
    due_date = now_utc + timedelta(days=30)
    validate_bill_dates(now_utc, due_date)

    vendor_bill = VendorBill(
        bill_number=bill_number,
        po_id=po.id,
        vendor_id=po.vendor_id,
        bill_date=now_utc,
        due_date=due_date,
        total=po.total,
        tax_percent=po.tax_percent,
        tax_amount=bill_tax_amount,
        total_with_tax=bill_total_with_tax,
        amount_paid=0.0,
        status="open",
        journal_entry_id=journal_entry.id,
    )
    db.add(vendor_bill)
    db.flush()

    # 7. Mirror PO lines into VendorBill lines
    for line in po.lines:
        bill_line = VendorBillLine(
            bill_id=vendor_bill.id,
            product_id=line.product_id,
            account_id=line.account_id or default_expense_id,
            analytic_account_id=line.analytic_account_id,
            quantity=line.quantity,
            unit_price=line.unit_price,
            subtotal=line.subtotal,
        )
        db.add(bill_line)

    try:
        # 8. Transition PO status to billed atomically with the bill and journal entry
        po.status = "billed"
        # 'commit' finalizes the database transaction persisting all changes permanently
        db.commit()
    except Exception:
        # 'rollback' reverts uncommitted database state preventing orphan records or partial postings
        db.rollback()
        raise

    # 9. Reload with relationships for full response
    full_bill = db.scalar(
        select(VendorBill)
        .options(
            joinedload(VendorBill.vendor),
            joinedload(VendorBill.purchase_order),
            joinedload(VendorBill.lines).joinedload(VendorBillLine.product),
            joinedload(VendorBill.lines).joinedload(VendorBillLine.account),
        )
        .where(VendorBill.id == vendor_bill.id)
    )

    full_je = db.scalar(
        select(JournalEntry)
        .options(
            joinedload(JournalEntry.journal),
            joinedload(JournalEntry.items).joinedload(JournalItem.account),
        )
        .where(JournalEntry.id == journal_entry.id)
    )

    return CreateBillResponse(
        bill=_build_bill_response(full_bill),
        journal_entry=_build_je_response(full_je),
    )


# Fetches an individual vendor bill by ID and loads associated lines and relationships
def get_vendor_bill(db: Session, bill_id: int) -> VendorBillResponse:
    bill = db.scalar(
        select(VendorBill)
        # 'joinedload' keyword is used here to eagerly load foreign relationships in SQL JOINs to prevent N+1 queries
        .options(
            joinedload(VendorBill.vendor),
            joinedload(VendorBill.purchase_order),
            joinedload(VendorBill.lines).joinedload(VendorBillLine.product),
            joinedload(VendorBill.lines).joinedload(VendorBillLine.account),
        )
        .where(VendorBill.id == bill_id)
    )
    if not bill:
        raise NotFoundException("VendorBill", bill_id)

    return _build_bill_response(bill)


BILL_SORT_MAP = {
    "bill_number": VendorBill.bill_number,
    "bill_date": VendorBill.bill_date,
    "total": VendorBill.total,
    "created_at": VendorBill.created_at,
    "id": VendorBill.id,
}


# Queries paginated, filtered, and sorted vendor bills with calculated page totals
def list_vendor_bills(
    db: Session,
    status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[List[VendorBillResponse], int, int, int, int]:
    count_stmt = select(func.count(VendorBill.id))

    if status:
        count_stmt = count_stmt.where(VendorBill.status == status)
    if vendor_id:
        count_stmt = count_stmt.where(VendorBill.vendor_id == vendor_id)
    if search:
        search_pattern = f"%{search}%"
        count_stmt = count_stmt.join(VendorBill.vendor).where(
            or_(
                VendorBill.bill_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    total = db.scalar(count_stmt) or 0

    stmt = select(VendorBill).options(
        joinedload(VendorBill.vendor),
        joinedload(VendorBill.purchase_order),
        joinedload(VendorBill.lines).joinedload(VendorBillLine.product),
        joinedload(VendorBill.lines).joinedload(VendorBillLine.account),
    )

    if status:
        stmt = stmt.where(VendorBill.status == status)
    if vendor_id:
        stmt = stmt.where(VendorBill.vendor_id == vendor_id)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.join(VendorBill.vendor).where(
            or_(
                VendorBill.bill_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    sort_col = BILL_SORT_MAP.get(sort_by, VendorBill.created_at)
    order_func = desc if sort_order.lower() == "desc" else asc
    stmt = stmt.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    bills = db.scalars(stmt).unique().all()
    bill_responses = [_build_bill_response(b) for b in bills]
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1

    return bill_responses, total, page, limit, pages


def cancel_vendor_bill(db: Session, bill_id: int) -> VendorBillResponse:
    """Cancel a Vendor Bill ('open' -> 'cancelled'). Cannot cancel if any payments have been made."""
    bill = db.scalar(select(VendorBill).where(VendorBill.id == bill_id))
    if not bill:
        raise NotFoundException("VendorBill", bill_id)

    if bill.status == "cancelled":
        raise ValidationException("Vendor Bill is already cancelled")
    if bill.amount_paid and bill.amount_paid > 0:
        raise ValidationException("Cannot cancel a Vendor Bill with existing payments")
    if bill.status in ("paid", "partially_paid"):
        raise ValidationException(f"Cannot cancel a Vendor Bill in status '{bill.status}'")

    try:
        bill.status = "cancelled"
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_vendor_bill(db, bill_id)

