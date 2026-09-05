"""
Sales Order API endpoints (Phase 3, P0-BE-05 mirror).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.schemas.sales_order import SOCreate, SOResponse, SOListResponse
from app.schemas.customer_invoice import CreateInvoiceResponse
from app.services import sales_order_service, customer_invoice_service

# 'dependencies' parameter attaches global security guards enforcing admin or invoicing_user authorization
router = APIRouter(dependencies=[Depends(require_roles(["admin", "invoicing_user"]))])


# Endpoint to create a new Sales Order in draft status with line items
@router.post("", response_model=SOResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=SOResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_sales_order(req: SOCreate, db: Session = Depends(get_db)):
    """Create a new Sales Order in draft status."""
    return sales_order_service.create_sales_order(db, req)


# Endpoint to query paginated, filtered, and sorted Sales Orders
@router.get("", response_model=SOListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=SOListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_sales_orders(
    # 'Query' keyword configures query parameter metadata, default values, and validation bounds
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (draft, confirmed, invoiced)"),
    customer_id: Optional[int] = Query(None, description="Filter by Customer Contact ID"),
    search: Optional[str] = Query(None, description="Search by SO number or Customer name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (so_number, order_date, total, created_at, id)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
):
    """List Sales Orders with optional filtering, sorting, and pagination."""
    sos, total, page, limit, pages = sales_order_service.list_sales_orders(
        db,
        status=status_filter,
        customer_id=customer_id,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return SOListResponse(data=sos, total=total, page=page, limit=limit, pages=pages)


# Endpoint to retrieve full details of a specific Sales Order
@router.get("/{so_id}", response_model=SOResponse, status_code=status.HTTP_200_OK)
def get_sales_order(so_id: int, db: Session = Depends(get_db)):
    """Get Sales Order detail by ID."""
    return sales_order_service.get_sales_order(db, so_id)


# Endpoint to confirm a draft Sales Order
@router.patch("/{so_id}/confirm", response_model=SOResponse, status_code=status.HTTP_200_OK)
def confirm_sales_order(so_id: int, db: Session = Depends(get_db)):
    """Confirm a Sales Order (draft -> confirmed)."""
    return sales_order_service.confirm_sales_order(db, so_id)


# Endpoint to generate a Customer Invoice from a confirmed Sales Order and post automated journal entry
@router.post("/{so_id}/create-invoice", response_model=CreateInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice_from_sales_order(so_id: int, db: Session = Depends(get_db)):
    """Convert a confirmed Sales Order into a Customer Invoice and post balanced Journal Entry."""
    return customer_invoice_service.create_invoice_from_so(db, so_id)
