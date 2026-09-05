"""
Customer Invoice API endpoints (Phase 3, P0-BE-06 mirror).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.customer_invoice import CustomerInvoiceResponse, CustomerInvoiceListResponse
from app.services import customer_invoice_service

router = APIRouter()


# Endpoint to query paginated, filtered, and sorted Customer Invoices
@router.get("", response_model=CustomerInvoiceListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=CustomerInvoiceListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_customer_invoices(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (open, paid, partially_paid)"),
    customer_id: Optional[int] = Query(None, description="Filter by Customer Contact ID"),
    search: Optional[str] = Query(None, description="Search by invoice number or Customer name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (invoice_number, invoice_date, total, created_at, id)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
):
    """List Customer Invoices with optional filtering, sorting, and pagination."""
    invoices, total, page, limit, pages = customer_invoice_service.list_customer_invoices(
        db,
        status=status_filter,
        customer_id=customer_id,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return CustomerInvoiceListResponse(data=invoices, total=total, page=page, limit=limit, pages=pages)


# Endpoint to fetch an individual Customer Invoice with its line items
@router.get("/{invoice_id}", response_model=CustomerInvoiceResponse, status_code=status.HTTP_200_OK)
def get_customer_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get Customer Invoice detail by ID."""
    return customer_invoice_service.get_customer_invoice(db, invoice_id)
