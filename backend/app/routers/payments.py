"""
Unified Payment API endpoints supporting inbound/outbound financial movements (Phase 2, P0-BE-07).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentListResponse,
)
from app.services import payment_service

# 'dependencies' parameter enforces route-level authentication guards globally across inbound and outbound payments
router = APIRouter(dependencies=[Depends(require_roles(["admin", "invoicing_user"]))])


# Records a new payment and auto-posts balanced double-entry journal items
@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def record_payment(
    req: PaymentCreate,
    # 'Depends' keyword injects a managed scoped SQLAlchemy session into the route execution
    db: Session = Depends(get_db),
):
    """
    Record an outbound or inbound payment.
    - For outbound payments, `bill_id` must be provided.
    - Automatically creates and posts the corresponding double-entry Journal Entry.
    """
    return payment_service.create_payment(db, req)


# Retrieves paginated, sorted, and filtered financial payments
@router.get("", response_model=PaymentListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=PaymentListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_payments(
    payment_type: Optional[str] = Query(None, description="Filter by payment type ('outbound', 'inbound')"),
    contact_id: Optional[int] = Query(None, description="Filter by Contact ID"),
    bill_id: Optional[int] = Query(None, description="Filter by Vendor Bill ID"),
    invoice_id: Optional[int] = Query(None, description="Filter by Customer Invoice ID"),
    payment_method: Optional[str] = Query(None, description="Filter by method ('bank', 'cash')"),
    search: Optional[str] = Query(None, description="Search by payment number or contact name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (payment_number, date, amount, created_at, id)"),
    sort_order: str = Query("desc", description="Sort order ('asc', 'desc')"),
    db: Session = Depends(get_db),
):
    """List financial payments with search, multi-field filtering, and pagination."""
    payments, total, page, limit, pages = payment_service.list_payments(
        db=db,
        payment_type=payment_type,
        contact_id=contact_id,
        bill_id=bill_id,
        invoice_id=invoice_id,
        payment_method=payment_method,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return PaymentListResponse(data=payments, total=total, page=page, limit=limit, pages=pages)


# Fetches a specific payment transaction record by its unique identifier
@router.get("/{payment_id}", response_model=PaymentResponse, status_code=status.HTTP_200_OK)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve detailed payment transaction by ID."""
    return payment_service.get_payment(db, payment_id)
