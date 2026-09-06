"""
Service logic for Purchase Orders (P0-BE-05).
"""

from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_

from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.contact import Contact
from app.models.product import Product
from app.models.account import Account
from app.schemas.purchase_order import POCreate, POResponse, POLineResponse, POUpdate
from app.core.exceptions import NotFoundException, ValidationException, ConflictException


def generate_po_number(db: Session) -> str:
    """Generate sequential PO number in PO-0001 format."""
    count = db.scalar(select(func.count(PurchaseOrder.id))) or 0
    return f"PO-{(count + 1):04d}"


def _build_po_response(po: PurchaseOrder) -> POResponse:
    """Helper to convert PurchaseOrder ORM object to POResponse with enriched names."""
    lines_resp = []
    for line in po.lines:
        lines_resp.append(
            POLineResponse(
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

    return POResponse(
        id=po.id,
        po_number=po.po_number,
        vendor_id=po.vendor_id,
        vendor_name=po.vendor.name if po.vendor else None,
        status=po.status,
        total=po.total,
        tax_percent=po.tax_percent,
        tax_amount=po.tax_amount,
        total_with_tax=po.total_with_tax,
        order_date=po.order_date,
        created_at=po.created_at,
        lines=lines_resp,
    )


def create_purchase_order(db: Session, po_in: POCreate) -> POResponse:
    """Create a new Purchase Order in draft status."""
    # 1. Validate Vendor contact
    vendor = db.scalar(select(Contact).where(Contact.id == po_in.vendor_id))
    if not vendor:
        raise NotFoundException("Contact", po_in.vendor_id)

    # 2. Get default Purchase Expense account (5010) if line account is missing
    default_account = db.scalar(select(Account).where(Account.code == "5010"))
    default_account_id = default_account.id if default_account else None

    # 3. Create PO record
    po_number = generate_po_number(db)
    order_date = po_in.order_date or datetime.now(timezone.utc)

    po = PurchaseOrder(
        po_number=po_number,
        vendor_id=po_in.vendor_id,
        order_date=order_date,
        status="draft",
        total=0.0,
    )
    db.add(po)
    db.flush()  # assign po.id

    total_amount = 0.0
    for line_in in po_in.lines:
        # Validate product
        product = db.scalar(select(Product).where(Product.id == line_in.product_id))
        if not product:
            raise NotFoundException("Product", line_in.product_id)

        account_id = line_in.account_id or default_account_id
        if account_id:
            acc = db.scalar(select(Account).where(Account.id == account_id))
            if not acc:
                raise NotFoundException("Account", account_id)

        subtotal = round(line_in.quantity * line_in.unit_price, 2)
        total_amount += subtotal

        po_line = PurchaseOrderLine(
            po_id=po.id,
            product_id=line_in.product_id,
            account_id=account_id,
            analytic_account_id=line_in.analytic_account_id,
            quantity=line_in.quantity,
            unit_price=line_in.unit_price,
            subtotal=subtotal,
        )
        db.add(po_line)

    try:
        po.total = round(total_amount, 2)
        tax_pct = getattr(po_in, 'tax_percent', 0.0) or 0.0
        po.tax_percent = round(tax_pct, 2)
        po.tax_amount = round(po.total * po.tax_percent / 100, 2)
        po.total_with_tax = round(po.total + po.tax_amount, 2)
        # 'commit' persists the draft Purchase Order and lines atomically
        db.commit()
    except Exception:
        # 'rollback' cancels uncommitted transactions preventing database corruption
        db.rollback()
        raise

    # Reload PO with relationships
    return get_purchase_order(db, po.id)


def get_purchase_order(db: Session, po_id: int) -> POResponse:
    """Retrieve Purchase Order detail by ID."""
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

    return _build_po_response(po)


def update_purchase_order(db: Session, po_id: int, po_in: POUpdate) -> POResponse:
    """Replace a draft Purchase Order and its lines atomically."""
    po = db.scalar(
        select(PurchaseOrder)
        .options(joinedload(PurchaseOrder.lines))
        .where(PurchaseOrder.id == po_id)
    )
    if not po:
        raise NotFoundException("PurchaseOrder", po_id)
    if po.status != "draft":
        raise ValidationException(f"Cannot edit Purchase Order in status '{po.status}'")

    vendor = db.scalar(select(Contact).where(Contact.id == po_in.vendor_id))
    if not vendor:
        raise NotFoundException("Contact", po_in.vendor_id)

    default_account = db.scalar(select(Account).where(Account.code == "5010"))
    default_account_id = default_account.id if default_account else None
    replacement_lines = []
    total_amount = 0.0

    for line_in in po_in.lines:
        product = db.scalar(select(Product).where(Product.id == line_in.product_id))
        if not product:
            raise NotFoundException("Product", line_in.product_id)

        account_id = line_in.account_id or default_account_id
        if account_id:
            account = db.scalar(select(Account).where(Account.id == account_id))
            if not account:
                raise NotFoundException("Account", account_id)

        subtotal = round(line_in.quantity * line_in.unit_price, 2)
        total_amount += subtotal
        replacement_lines.append(
            PurchaseOrderLine(
                product_id=line_in.product_id,
                account_id=account_id,
                analytic_account_id=line_in.analytic_account_id,
                quantity=line_in.quantity,
                unit_price=line_in.unit_price,
                subtotal=subtotal,
            )
        )

    try:
        po.vendor_id = po_in.vendor_id
        po.order_date = po_in.order_date or datetime.now(timezone.utc)
        po.total = round(total_amount, 2)
        tax_pct = getattr(po_in, 'tax_percent', 0.0) or 0.0
        po.tax_percent = round(tax_pct, 2)
        po.tax_amount = round(po.total * po.tax_percent / 100, 2)
        po.total_with_tax = round(po.total + po.tax_amount, 2)
        po.lines.clear()
        po.lines.extend(replacement_lines)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_purchase_order(db, po_id)


import math
from sqlalchemy import asc, desc, or_

PO_SORT_MAP = {
    "po_number": PurchaseOrder.po_number,
    "order_date": PurchaseOrder.order_date,
    "total": PurchaseOrder.total,
    "created_at": PurchaseOrder.created_at,
    "id": PurchaseOrder.id,
}


def list_purchase_orders(
    db: Session,
    status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[List[POResponse], int, int, int, int]:
    """List Purchase Orders with optional filtering, sorting, and pagination."""
    # Query count of distinct POs
    count_stmt = select(func.count(PurchaseOrder.id))

    if status:
        count_stmt = count_stmt.where(PurchaseOrder.status == status)
    if vendor_id:
        count_stmt = count_stmt.where(PurchaseOrder.vendor_id == vendor_id)
    if search:
        search_pattern = f"%{search}%"
        count_stmt = count_stmt.join(PurchaseOrder.vendor).where(
            or_(
                PurchaseOrder.po_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    total = db.scalar(count_stmt) or 0

    stmt = select(PurchaseOrder).options(
        joinedload(PurchaseOrder.vendor),
        joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.product),
        joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.account),
    )

    if status:
        stmt = stmt.where(PurchaseOrder.status == status)
    if vendor_id:
        stmt = stmt.where(PurchaseOrder.vendor_id == vendor_id)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.join(PurchaseOrder.vendor).where(
            or_(
                PurchaseOrder.po_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    sort_col = PO_SORT_MAP.get(sort_by, PurchaseOrder.created_at)
    order_func = desc if sort_order.lower() == "desc" else asc
    stmt = stmt.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    pos = db.scalars(stmt).unique().all()
    po_responses = [_build_po_response(po) for po in pos]
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1
    return po_responses, total, page, limit, pages



def confirm_purchase_order(db: Session, po_id: int) -> POResponse:
    """Confirm a Purchase Order ('draft' -> 'confirmed') with budget-exceeded blocking check."""
    po = db.scalar(
        select(PurchaseOrder)
        .options(joinedload(PurchaseOrder.lines))
        .where(PurchaseOrder.id == po_id)
    )
    if not po:
        raise NotFoundException("PurchaseOrder", po_id)

    if po.status != "draft":
        raise ValidationException(f"Cannot confirm Purchase Order in status '{po.status}'")

    # Budget-exceeded blocking check: validate each line's analytic account against active budgets
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

    try:
        po.status = "confirmed"
        # 'commit' transitions PO lifecycle state atomically
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_purchase_order(db, po_id)


def cancel_purchase_order(db: Session, po_id: int) -> POResponse:
    """Cancel a Purchase Order ('draft' or 'confirmed' -> 'cancelled'). Cannot cancel if already billed."""
    po = db.scalar(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    if not po:
        raise NotFoundException("PurchaseOrder", po_id)

    if po.status == "cancelled":
        raise ValidationException("Purchase Order is already cancelled")
    if po.status == "billed":
        raise ValidationException("Cannot cancel a Purchase Order that has already been billed")

    try:
        po.status = "cancelled"
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_purchase_order(db, po_id)
