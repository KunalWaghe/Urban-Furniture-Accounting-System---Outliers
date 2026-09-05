"""
Service logic for Sales Orders (Phase 3, P0-BE-05 mirror).
"""

import math
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_, asc, desc

from app.models.sales_order import SalesOrder, SalesOrderLine
from app.models.contact import Contact
from app.models.product import Product
from app.models.account import Account
from app.schemas.sales_order import SOCreate, SOResponse, SOLineResponse
from app.core.exceptions import NotFoundException, ValidationException


# Generates a sequential sales order identifier formatted as SO-0001
def generate_so_number(db: Session) -> str:
    # 'func.count' executes a SQL COUNT(*) aggregation across the sales_orders table
    count = db.scalar(select(func.count(SalesOrder.id))) or 0
    return f"SO-{(count + 1):04d}"


# Transforms a SalesOrder ORM instance into an enriched SOResponse schema
def _build_so_response(so: SalesOrder) -> SOResponse:
    lines_resp = []
    for line in so.lines:
        lines_resp.append(
            SOLineResponse(
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

    return SOResponse(
        id=so.id,
        so_number=so.so_number,
        customer_id=so.customer_id,
        customer_name=so.customer.name if so.customer else None,
        status=so.status,
        total=so.total,
        order_date=so.order_date,
        created_at=so.created_at,
        lines=lines_resp,
    )


# Creates a new Sales Order along with lines in draft status
def create_sales_order(db: Session, so_in: SOCreate) -> SOResponse:
    # 1. Validate customer contact exists
    customer = db.scalar(select(Contact).where(Contact.id == so_in.customer_id))
    if not customer:
        raise NotFoundException("Contact", so_in.customer_id)

    # 2. Get default Sales Income account (4010) for lines without account_id
    default_account = db.scalar(select(Account).where(Account.code == "4010"))
    default_account_id = default_account.id if default_account else None

    # 3. Create Sales Order header
    so_number = generate_so_number(db)
    order_date = so_in.order_date or datetime.now(timezone.utc)

    so = SalesOrder(
        so_number=so_number,
        customer_id=so_in.customer_id,
        order_date=order_date,
        status="draft",
        total=0.0,
    )
    db.add(so)
    # 'flush' keyword writes pending changes to the database to generate so.id without ending the transaction
    db.flush()

    total_amount = 0.0
    for line_in in so_in.lines:
        # Validate that product exists
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

        so_line = SalesOrderLine(
            so_id=so.id,
            product_id=line_in.product_id,
            account_id=account_id,
            analytic_account_id=line_in.analytic_account_id,
            quantity=line_in.quantity,
            unit_price=line_in.unit_price,
            subtotal=subtotal,
        )
        db.add(so_line)

    so.total = round(total_amount, 2)
    db.commit()

    # Reload SO with full relations
    return get_sales_order(db, so.id)


# Retrieves single Sales Order by primary key ID with all joined relationship entities
def get_sales_order(db: Session, so_id: int) -> SOResponse:
    so = db.scalar(
        select(SalesOrder)
        # 'joinedload' keyword eagerly loads foreign relationships in SQL JOINs to prevent N+1 queries
        .options(
            joinedload(SalesOrder.customer),
            joinedload(SalesOrder.lines).joinedload(SalesOrderLine.product),
            joinedload(SalesOrder.lines).joinedload(SalesOrderLine.account),
        )
        .where(SalesOrder.id == so_id)
    )
    if not so:
        raise NotFoundException("SalesOrder", so_id)

    return _build_so_response(so)


# Lookup dictionary for mapping sort field names to model columns
SO_SORT_MAP = {
    "so_number": SalesOrder.so_number,
    "order_date": SalesOrder.order_date,
    "total": SalesOrder.total,
    "created_at": SalesOrder.created_at,
    "id": SalesOrder.id,
}


# Fetches a paginated, filtered, and sorted collection of Sales Orders
def list_sales_orders(
    db: Session,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[List[SOResponse], int, int, int, int]:
    # Query total count matching filter conditions
    count_stmt = select(func.count(SalesOrder.id))

    if status:
        count_stmt = count_stmt.where(SalesOrder.status == status)
    if customer_id:
        count_stmt = count_stmt.where(SalesOrder.customer_id == customer_id)
    if search:
        search_pattern = f"%{search}%"
        # 'ilike' keyword performs case-insensitive wildcard substring search
        count_stmt = count_stmt.join(SalesOrder.customer).where(
            or_(
                SalesOrder.so_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    total = db.scalar(count_stmt) or 0

    stmt = select(SalesOrder).options(
        joinedload(SalesOrder.customer),
        joinedload(SalesOrder.lines).joinedload(SalesOrderLine.product),
        joinedload(SalesOrder.lines).joinedload(SalesOrderLine.account),
    )

    if status:
        stmt = stmt.where(SalesOrder.status == status)
    if customer_id:
        stmt = stmt.where(SalesOrder.customer_id == customer_id)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.join(SalesOrder.customer).where(
            or_(
                SalesOrder.so_number.ilike(search_pattern),
                Contact.name.ilike(search_pattern),
            )
        )

    sort_col = SO_SORT_MAP.get(sort_by, SalesOrder.created_at)
    order_func = desc if sort_order.lower() == "desc" else asc
    stmt = stmt.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    # 'scalars' extracts model instances; 'unique' deduplicates rows produced by joinedload
    sos = db.scalars(stmt).unique().all()
    so_responses = [_build_so_response(so) for so in sos]
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1
    return so_responses, total, page, limit, pages


# Confirms a draft Sales Order transitioning its state from 'draft' to 'confirmed'
def confirm_sales_order(db: Session, so_id: int) -> SOResponse:
    so = db.scalar(select(SalesOrder).where(SalesOrder.id == so_id))
    if not so:
        raise NotFoundException("SalesOrder", so_id)

    if so.status != "draft":
        raise ValidationException(f"Cannot confirm Sales Order in status '{so.status}'")

    so.status = "confirmed"
    db.commit()

    return get_sales_order(db, so_id)
