"""
Payment domain service managing financial settlements, double-entry postings, and bill reconciliation (Phase 2, P0-BE-07).
"""

import math
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_, desc, asc

from app.models.payment import Payment
from app.models.vendor_bill import VendorBill
from app.models.account import Account
from app.models.journal import Journal
from app.models.contact import Contact
from app.models.journal_entry import JournalEntry
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
)
from app.services.accounting_service import seed_accounting_defaults
from app.services.journal_engine import post_journal_entry
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
)


# Generates a sequentially ordered unique payment number e.g. PAY-0001
def generate_payment_number(db: Session) -> str:
    # 'func.count' aggregates total payment records for deterministic sequential numbering
    count = db.scalar(select(func.count(Payment.id))) or 0
    return f"PAY-{(count + 1):04d}"


# Transforms a Payment ORM model instance into a strongly-typed Pydantic response
def _build_payment_response(p: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=p.id,
        payment_number=p.payment_number,
        payment_type=p.payment_type,
        contact_id=p.contact_id,
        contact_name=p.contact.name if p.contact else None,
        bill_id=p.bill_id,
        bill_number=p.vendor_bill.bill_number if p.vendor_bill else None,
        invoice_id=p.invoice_id,
        journal_id=p.journal_id,
        journal_code=p.journal.code if p.journal else None,
        journal_name=p.journal.name if p.journal else None,
        amount=p.amount,
        payment_method=p.payment_method,
        date=p.date,
        note=p.note,
        journal_entry_id=p.journal_entry_id,
        journal_entry_number=p.journal_entry.entry_number if p.journal_entry else None,
        status=p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


# Settles a vendor bill by validating balances, updating bill status, and posting ledger entries
def create_outbound_payment(
    db: Session,
    bill_id: int,
    amount: float,
    payment_method: str,
    date: Optional[datetime] = None,
    note: Optional[str] = None,
) -> PaymentResponse:
    # Ensure default accounts and journals are seeded in case this is a fresh database
    seed_accounting_defaults(db)

    # 1. Fetch VendorBill and validate current settlement status
    # 'joinedload' eagerly fetches the vendor contact in a single query to eliminate lazy loading delays
    bill = db.scalar(
        select(VendorBill)
        .options(joinedload(VendorBill.vendor))
        .where(VendorBill.id == bill_id)
    )
    if not bill:
        raise NotFoundException("VendorBill", bill_id)

    if bill.status == "paid":
        raise ConflictException(
            code="BILL_ALREADY_PAID",
            message=f"Vendor bill {bill.bill_number} is already fully paid",
        )

    if bill.status == "cancelled":
        raise ValidationException(f"Cannot pay cancelled vendor bill {bill.bill_number}")

    if bill.status not in ("open", "partially_paid"):
        raise ValidationException(f"Cannot record payment for bill in status '{bill.status}'")

    # 2. Validate payment amount against remaining unallocated balance
    if amount <= 0:
        raise ValidationException("Payment amount must be greater than zero")

    # 'round' keyword eliminates 64-bit IEEE 754 floating-point inaccuracies during arithmetic
    remaining_balance = round(bill.total - bill.amount_paid, 2)
    rounded_amount = round(amount, 2)

    if rounded_amount > remaining_balance:
        raise ValidationException(
            f"Payment amount ({rounded_amount:.2f}) exceeds remaining bill balance ({remaining_balance:.2f}) for bill {bill.bill_number}"
        )

    # 3. Determine target journal and asset account based on payment method
    pm = payment_method.strip().lower()
    if pm == "bank":
        journal_code = "BNK"
        asset_account_code = "1020"  # Bank Account
    elif pm == "cash":
        journal_code = "CSH"
        asset_account_code = "1010"  # Cash
    else:
        raise ValidationException("Invalid payment method. Allowed options are 'bank' or 'cash'")

    journal = db.scalar(select(Journal).where(Journal.code == journal_code))
    if not journal:
        raise NotFoundException("Journal", journal_code)

    # Accounts Payable (code 2010 - Trade Creditors)
    ap_account = db.scalar(select(Account).where(Account.code == "2010"))
    if not ap_account:
        raise NotFoundException("Account", "2010")

    asset_account = db.scalar(select(Account).where(Account.code == asset_account_code))
    if not asset_account:
        raise NotFoundException("Account", asset_account_code)

    # 4. Generate sequential payment identifier
    payment_number = generate_payment_number(db)
    payment_date = date or datetime.now(timezone.utc)

    # 5. Post balancing double-entry journal items:
    # Debit Accounts Payable (liability decreases) | Credit Bank/Cash (asset decreases)
    lines = [
        {
            "account_id": ap_account.id,
            "partner_id": bill.vendor_id,
            "debit": rounded_amount,
            "credit": 0.0,
            "description": f"Bill Payment {payment_number} for {bill.bill_number}",
        },
        {
            "account_id": asset_account.id,
            "partner_id": bill.vendor_id,
            "debit": 0.0,
            "credit": rounded_amount,
            "description": f"Bill Payment {payment_number} for {bill.bill_number}",
        },
    ]

    journal_entry = post_journal_entry(
        db=db,
        journal_code=journal_code,
        reference=payment_number,
        entry_date=payment_date,
        lines=lines,
        is_posted=True,
    )

    # 6. Update VendorBill paid accumulation and determine lifecycle status transition
    new_amount_paid = round(bill.amount_paid + rounded_amount, 2)
    bill.amount_paid = new_amount_paid

    # Use epsilon threshold of 0.001 to guarantee exact closure of fully settled bills
    if new_amount_paid >= round(bill.total, 2) - 0.001:
        bill.status = "paid"
    else:
        bill.status = "partially_paid"

    # 7. Persist Payment ledger record
    payment = Payment(
        payment_number=payment_number,
        payment_type="outbound",
        contact_id=bill.vendor_id,
        bill_id=bill.id,
        invoice_id=None,
        journal_id=journal.id,
        amount=rounded_amount,
        payment_method=pm,
        date=payment_date,
        note=note,
        journal_entry_id=journal_entry.id,
        status="posted",
    )
    db.add(payment)
    # 'commit' persists all entities (bill update, journal entry, payment) atomically in one transaction
    db.commit()

    # 8. Reload payment with related joined models for full response
    full_payment = db.scalar(
        select(Payment)
        .options(
            joinedload(Payment.contact),
            joinedload(Payment.vendor_bill),
            joinedload(Payment.journal),
            joinedload(Payment.journal_entry),
        )
        .where(Payment.id == payment.id)
    )

    return _build_payment_response(full_payment)


# Dispatches generic payment creation requests to specific inbound or outbound handlers
def create_payment(db: Session, req: PaymentCreate) -> PaymentResponse:
    if req.payment_type == "outbound":
        if not req.bill_id:
            raise ValidationException("bill_id is required for outbound bill payments")
        return create_outbound_payment(
            db=db,
            bill_id=req.bill_id,
            amount=req.amount,
            payment_method=req.payment_method,
            date=req.date,
            note=req.note,
        )
    elif req.payment_type == "inbound":
        # 'raise' statement guards endpoint until Customer Invoices are built in Phase 4
        raise ValidationException("Inbound customer invoice payments will be supported in Phase 4")
    else:
        raise ValidationException(f"Unsupported payment_type: '{req.payment_type}'")


# Retrieves single payment by its primary key or raises a 404 NotFoundException
def get_payment(db: Session, payment_id: int) -> PaymentResponse:
    payment = db.scalar(
        select(Payment)
        .options(
            joinedload(Payment.contact),
            joinedload(Payment.vendor_bill),
            joinedload(Payment.journal),
            joinedload(Payment.journal_entry),
        )
        .where(Payment.id == payment_id)
    )
    if not payment:
        raise NotFoundException("Payment", payment_id)

    return _build_payment_response(payment)


PAYMENT_SORT_MAP = {
    "payment_number": Payment.payment_number,
    "date": Payment.date,
    "amount": Payment.amount,
    "created_at": Payment.created_at,
    "id": Payment.id,
}


# Fetches paginated, filtered, and sorted payment records across the financial system
def list_payments(
    db: Session,
    payment_type: Optional[str] = None,
    contact_id: Optional[int] = None,
    bill_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[List[PaymentResponse], int, int, int, int]:
    count_stmt = select(func.count(Payment.id))

    if payment_type:
        count_stmt = count_stmt.where(Payment.payment_type == payment_type)
    if contact_id:
        count_stmt = count_stmt.where(Payment.contact_id == contact_id)
    if bill_id:
        count_stmt = count_stmt.where(Payment.bill_id == bill_id)
    if payment_method:
        count_stmt = count_stmt.where(Payment.payment_method == payment_method.lower())
    if search:
        search_pattern = f"%{search}%"
        # 'ilike' performs case-insensitive wildcard substring matching in SQL
        count_stmt = count_stmt.join(Payment.contact).where(
            or_(
                Payment.payment_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    # 'scalar' keyword executes statement and unwraps the single aggregate numeric count value
    total = db.scalar(count_stmt) or 0

    stmt = select(Payment).options(
        joinedload(Payment.contact),
        joinedload(Payment.vendor_bill),
        joinedload(Payment.journal),
        joinedload(Payment.journal_entry),
    )

    if payment_type:
        stmt = stmt.where(Payment.payment_type == payment_type)
    if contact_id:
        stmt = stmt.where(Payment.contact_id == contact_id)
    if bill_id:
        stmt = stmt.where(Payment.bill_id == bill_id)
    if payment_method:
        stmt = stmt.where(Payment.payment_method == payment_method.lower())
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.join(Payment.contact).where(
            or_(
                Payment.payment_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    sort_col = PAYMENT_SORT_MAP.get(sort_by, Payment.created_at)
    order_func = desc if sort_order.lower() == "desc" else asc
    stmt = stmt.order_by(order_func(sort_col))

    # 'offset' calculates starting tuple position for database cursor pagination
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    # 'unique' filters duplicate rows generated by outer joins on relationship trees
    payments = db.scalars(stmt).unique().all()
    payment_responses = [_build_payment_response(p) for p in payments]
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1

    return payment_responses, total, page, limit, pages


# Retrieves all recorded payment settlements linked to a specific vendor bill
def get_payments_for_bill(db: Session, bill_id: int) -> List[PaymentResponse]:
    payments = (
        db.scalars(
            select(Payment)
            .options(
                joinedload(Payment.contact),
                joinedload(Payment.vendor_bill),
                joinedload(Payment.journal),
                joinedload(Payment.journal_entry),
            )
            .where(Payment.bill_id == bill_id)
            .order_by(desc(Payment.date))
        )
        .unique()
        .all()
    )
    return [_build_payment_response(p) for p in payments]
