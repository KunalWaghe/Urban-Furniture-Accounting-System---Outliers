"""
Service logic for Vendor Bills and automated Journal Entry posting (P0-BE-06).
"""

import math
from datetime import datetime, timezone
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
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    InvalidStatusTransitionException,
    ValidationException,
)


def generate_bill_number(db: Session) -> str:
    """Generate sequential Vendor Bill number in BILL-0001 format."""
    count = db.scalar(select(func.count(VendorBill.id))) or 0
    return f"BILL-{(count + 1):04d}"


def generate_je_number(db: Session) -> str:
    """Generate sequential Journal Entry number in JE-0001 format."""
    count = db.scalar(select(func.count(JournalEntry.id))) or 0
    return f"JE-{(count + 1):04d}"


def _build_bill_response(bill: VendorBill) -> VendorBillResponse:
    """Helper to convert VendorBill ORM object to VendorBillResponse."""
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
        vendor_id=bill.vendor_id,
        vendor_name=bill.vendor.name if bill.vendor else None,
        bill_date=bill.bill_date,
        total=bill.total,
        amount_paid=bill.amount_paid,
        status=bill.status,
        journal_entry_id=bill.journal_entry_id,
        lines=lines_resp if lines_resp else None,
    )


def _build_je_response(je: JournalEntry) -> JournalEntryResponse:
    """Helper to convert JournalEntry ORM object to JournalEntryResponse."""
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


def create_bill_from_po(db: Session, po_id: int) -> CreateBillResponse:
    """
    Convert a confirmed Purchase Order into a Vendor Bill and post the balanced Journal Entry.
    Debit: Purchase Expense accounts (for each line subtotal)
    Credit: Accounts Payable (2010) (for total bill amount)
    """
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

    purchase_journal = db.scalar(select(Journal).where(Journal.code == "PUR"))
    if not purchase_journal:
        purchase_journal = db.scalar(select(Journal).where(Journal.type == "purchase"))
    if not purchase_journal:
        raise ValidationException("Purchase Journal ('PUR') is not configured")

    ap_account = db.scalar(select(Account).where(Account.code == "2010"))
    if not ap_account:
        raise ValidationException("Accounts Payable (2010) account is not configured")

    default_expense = db.scalar(select(Account).where(Account.code == "5010"))
    default_expense_id = default_expense.id if default_expense else None

    # 5. Build Journal Entry items (balanced debits and credits)
    bill_number = generate_bill_number(db)
    je_number = generate_je_number(db)
    now_utc = datetime.now(timezone.utc)

    journal_entry = JournalEntry(
        entry_number=je_number,
        journal_id=purchase_journal.id,
        reference=bill_number,
        date=now_utc,
        total_amount=po.total,
        is_posted=True,
    )
    db.add(journal_entry)
    db.flush()

    total_debits = 0.0
    # Debit each expense line
    for line in po.lines:
        line_account_id = line.account_id or default_expense_id
        if not line_account_id:
            raise ValidationException(f"No expense account configured for line item with product #{line.product_id}")

        item_debit = JournalItem(
            journal_entry_id=journal_entry.id,
            account_id=line_account_id,
            partner_id=po.vendor_id,
            debit=line.subtotal,
            credit=0.0,
            description=f"Purchase of {line.product.name if line.product else 'product'}",
            analytic_account_id=line.analytic_account_id,
        )
        db.add(item_debit)
        total_debits += line.subtotal

    total_debits = round(total_debits, 2)
    total_credits = round(po.total, 2)

    if total_debits != total_credits:
        raise ValidationException(f"Total debits ({total_debits}) do not match total credits ({total_credits})")

    # Credit Accounts Payable (Creditors)
    item_credit = JournalItem(
        journal_entry_id=journal_entry.id,
        account_id=ap_account.id,
        partner_id=po.vendor_id,
        debit=0.0,
        credit=total_credits,
        description=f"Vendor Bill {bill_number} payable",
    )
    db.add(item_credit)
    db.flush()

    # 6. Create Vendor Bill record
    vendor_bill = VendorBill(
        bill_number=bill_number,
        po_id=po.id,
        vendor_id=po.vendor_id,
        bill_date=now_utc,
        total=po.total,
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

    # 8. Transition PO status to billed
    po.status = "billed"
    db.commit()

    # 9. Reload with relationships for full response
    full_bill = db.scalar(
        select(VendorBill)
        .options(
            joinedload(VendorBill.vendor),
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


def get_vendor_bill(db: Session, bill_id: int) -> VendorBillResponse:
    """Retrieve Vendor Bill detail by ID."""
    bill = db.scalar(
        select(VendorBill)
        .options(
            joinedload(VendorBill.vendor),
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
    """List Vendor Bills with optional filtering, sorting, and pagination."""
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
