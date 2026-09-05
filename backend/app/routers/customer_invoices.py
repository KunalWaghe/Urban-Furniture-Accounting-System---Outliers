"""
Customer Invoice API endpoints (Phase 3 & Phase 4).
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.customer_invoice import CustomerInvoiceResponse, CustomerInvoiceListResponse
from app.schemas.payment import InvoicePayRequest, PaymentResponse
from app.services import customer_invoice_service, payment_service

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


# Direct customer invoice payment endpoint to settle or partially pay an open customer invoice
@router.post("/{invoice_id}/pay", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def pay_customer_invoice(
    invoice_id: int,
    req: InvoicePayRequest,
    # 'Depends' injects managed SQLAlchemy database session bound to the request context
    db: Session = Depends(get_db),
):
    """
    Record an inbound payment directly against a specific customer invoice.
    Posts the corresponding Journal Entry and updates the invoice's paid balance and status.
    """
    return payment_service.create_inbound_payment(
        db=db,
        invoice_id=invoice_id,
        amount=req.amount,
        payment_method=req.payment_method,
        date=req.date,
        note=req.note,
    )


# Retrieves all payment history associated with a customer invoice
@router.get("/{invoice_id}/payments", response_model=List[PaymentResponse], status_code=status.HTTP_200_OK)
def get_invoice_payments(
    invoice_id: int,
    # 'Depends' injects transactional DB session
    db: Session = Depends(get_db),
):
    """Retrieve all payment records logged against a specific customer invoice."""
    return payment_service.get_payments_for_invoice(db, invoice_id)
