"""
Service logic for Customer Invoices and automated Sales Journal Entry posting (Phase 3, P0-BE-06 mirror).
"""

import math
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_, desc, asc

from app.models.customer_invoice import CustomerInvoice, CustomerInvoiceLine
from app.models.journal_entry import JournalEntry, JournalItem
from app.models.sales_order import SalesOrder, SalesOrderLine
from app.models.account import Account
from app.models.journal import Journal
from app.models.contact import Contact
from app.schemas.customer_invoice import (
    CustomerInvoiceResponse,
    CustomerInvoiceLineResponse,
    CreateInvoiceResponse,
)
from app.schemas.journal_entry import (
    JournalEntryResponse,
    JournalItemResponse,
)
from app.services.accounting_service import seed_accounting_defaults
from app.services.journal_engine import post_journal_entry
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    InvalidStatusTransitionException,
    ValidationException,
)


# Generates a sequential customer invoice identifier formatted as INV-0001
def generate_invoice_number(db: Session) -> str:
    # 'func.count' performs an aggregate count query to determine sequential numbering
    count = db.scalar(select(func.count(CustomerInvoice.id))) or 0
    return f"INV-{(count + 1):04d}"


# Converts a CustomerInvoice ORM entity into a validated Pydantic schema response
def _build_invoice_response(invoice: CustomerInvoice) -> CustomerInvoiceResponse:
    lines_resp = []
    if invoice.lines:
        for line in invoice.lines:
            lines_resp.append(
                CustomerInvoiceLineResponse(
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

    return CustomerInvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        so_id=invoice.so_id,
        so_number=invoice.sales_order.so_number if invoice.sales_order else None,
        customer_id=invoice.customer_id,
        customer_name=invoice.customer.name if invoice.customer else None,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        total=invoice.total,
        amount_paid=invoice.amount_paid,
        status=invoice.status,
        journal_entry_id=invoice.journal_entry_id,
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


# Converts a confirmed Sales Order into a Customer Invoice and posts the corresponding double-entry Journal Entry
def create_invoice_from_so(db: Session, so_id: int) -> CreateInvoiceResponse:
    # 1. Fetch Sales Order with eager loading
    so = db.scalar(
        select(SalesOrder)
        # 'joinedload' keyword issues SQL LEFT OUTER JOINs to eliminate N+1 query overhead
        .options(
            joinedload(SalesOrder.customer),
            joinedload(SalesOrder.lines).joinedload(SalesOrderLine.product),
            joinedload(SalesOrder.lines).joinedload(SalesOrderLine.account),
        )
        .where(SalesOrder.id == so_id)
    )
    if not so:
        raise NotFoundException("SalesOrder", so_id)

    # 2. Check if already invoiced or invoice exists
    existing_invoice = db.scalar(select(CustomerInvoice).where(CustomerInvoice.so_id == so_id))
    if existing_invoice or so.status == "invoiced":
        raise ConflictException(
            code="INVOICE_ALREADY_EXISTS",
            message=f"A Customer Invoice already exists for Sales Order '{so.so_number}'",
        )

    # 3. Guard status: SO must be confirmed
    if so.status != "confirmed":
        raise InvalidStatusTransitionException(
            f"Cannot create invoice for Sales Order with status '{so.status}'. SO must be confirmed."
        )

    # 4. Seed and resolve accounting master data
    seed_accounting_defaults(db)

    ar_account = db.scalar(select(Account).where(Account.code == "1030"))
    if not ar_account:
        raise ValidationException("Accounts Receivable / Debtors (1030) account is not configured")

    default_income = db.scalar(select(Account).where(Account.code == "4010"))
    default_income_id = default_income.id if default_income else None

    invoice_number = generate_invoice_number(db)
    now_utc = datetime.now(timezone.utc)

    # 5. Build Journal Entry lines:
    # Debit: Accounts Receivable / Debtors (1030) for full invoice total
    # Credit: Sales Income (4010) for each line's subtotal
    journal_lines = []

    # Debit Accounts Receivable (Debtors) for total invoice amount
    journal_lines.append({
        "account_id": ar_account.id,
        "partner_id": so.customer_id,
        "debit": so.total,
        "credit": 0.0,
        "description": f"Customer Invoice {invoice_number} receivable",
        "analytic_account_id": None,
    })

    for line in so.lines:
        line_account_id = line.account_id or default_income_id
        if not line_account_id:
            raise ValidationException(f"No income account configured for line item with product #{line.product_id}")

        journal_lines.append({
            "account_id": line_account_id,
            "partner_id": so.customer_id,
            "debit": 0.0,
            "credit": line.subtotal,
            "description": f"Sales of {line.product.name if line.product else 'product'}",
            "analytic_account_id": line.analytic_account_id,
        })

    # Post balanced journal entry using the unified journal engine
    journal_entry = post_journal_entry(
        db=db,
        journal_code="SLS",
        reference=invoice_number,
        entry_date=now_utc,
        lines=journal_lines,
        is_posted=True,
    )

    # 6. Create Customer Invoice record
    customer_invoice = CustomerInvoice(
        invoice_number=invoice_number,
        so_id=so.id,
        customer_id=so.customer_id,
        invoice_date=now_utc,
        total=so.total,
        amount_paid=0.0,
        status="open",
        journal_entry_id=journal_entry.id,
    )
    db.add(customer_invoice)
    # 'flush' keyword generates customer_invoice.id immediately without committing the whole unit of work
    db.flush()

    # 7. Mirror SO lines into CustomerInvoice lines
    for line in so.lines:
        invoice_line = CustomerInvoiceLine(
            invoice_id=customer_invoice.id,
            product_id=line.product_id,
            account_id=line.account_id or default_income_id,
            analytic_account_id=line.analytic_account_id,
            quantity=line.quantity,
            unit_price=line.unit_price,
            subtotal=line.subtotal,
        )
        db.add(invoice_line)

    # 8. Transition SO status to invoiced
    so.status = "invoiced"
    db.commit()

    # 9. Reload with relationships for full response envelope
    full_invoice = db.scalar(
        select(CustomerInvoice)
        .options(
            joinedload(CustomerInvoice.customer),
            joinedload(CustomerInvoice.lines).joinedload(CustomerInvoiceLine.product),
            joinedload(CustomerInvoice.lines).joinedload(CustomerInvoiceLine.account),
        )
        .where(CustomerInvoice.id == customer_invoice.id)
    )

    full_je = db.scalar(
        select(JournalEntry)
        .options(
            joinedload(JournalEntry.journal),
            joinedload(JournalEntry.items).joinedload(JournalItem.account),
        )
        .where(JournalEntry.id == journal_entry.id)
    )

    return CreateInvoiceResponse(
        invoice=_build_invoice_response(full_invoice),
        journal_entry=_build_je_response(full_je),
    )


# Fetches an individual customer invoice by ID and loads associated lines and relationships
def get_customer_invoice(db: Session, invoice_id: int) -> CustomerInvoiceResponse:
    invoice = db.scalar(
        select(CustomerInvoice)
        .options(
            joinedload(CustomerInvoice.customer),
            joinedload(CustomerInvoice.lines).joinedload(CustomerInvoiceLine.product),
            joinedload(CustomerInvoice.lines).joinedload(CustomerInvoiceLine.account),
        )
        .where(CustomerInvoice.id == invoice_id)
    )
    if not invoice:
        raise NotFoundException("CustomerInvoice", invoice_id)

    return _build_invoice_response(invoice)


# Lookup dictionary for mapping invoice sort field names to model columns
INVOICE_SORT_MAP = {
    "invoice_number": CustomerInvoice.invoice_number,
    "invoice_date": CustomerInvoice.invoice_date,
    "total": CustomerInvoice.total,
    "created_at": CustomerInvoice.created_at,
    "id": CustomerInvoice.id,
}


# Queries paginated, filtered, and sorted customer invoices with total page counts
def list_customer_invoices(
    db: Session,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[List[CustomerInvoiceResponse], int, int, int, int]:
    count_stmt = select(func.count(CustomerInvoice.id))

    if status:
        count_stmt = count_stmt.where(CustomerInvoice.status == status)
    if customer_id:
        count_stmt = count_stmt.where(CustomerInvoice.customer_id == customer_id)
    if search:
        search_pattern = f"%{search}%"
        count_stmt = count_stmt.join(CustomerInvoice.customer).where(
            or_(
                CustomerInvoice.invoice_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    total = db.scalar(count_stmt) or 0

    stmt = select(CustomerInvoice).options(
        joinedload(CustomerInvoice.customer),
        joinedload(CustomerInvoice.lines).joinedload(CustomerInvoiceLine.product),
        joinedload(CustomerInvoice.lines).joinedload(CustomerInvoiceLine.account),
    )

    if status:
        stmt = stmt.where(CustomerInvoice.status == status)
    if customer_id:
        stmt = stmt.where(CustomerInvoice.customer_id == customer_id)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.join(CustomerInvoice.customer).where(
            or_(
                CustomerInvoice.invoice_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    sort_col = INVOICE_SORT_MAP.get(sort_by, CustomerInvoice.created_at)
    order_func = desc if sort_order.lower() == "desc" else asc
    stmt = stmt.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    # 'unique' prevents duplicate root entities in result set after joined loading collection relationships
    invoices = db.scalars(stmt).unique().all()
    invoice_responses = [_build_invoice_response(inv) for inv in invoices]
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1

    return invoice_responses, total, page, limit, pages
