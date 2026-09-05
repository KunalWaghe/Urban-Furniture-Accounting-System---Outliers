"""
Vendor Bill API endpoints (P0-BE-06, Phase 2 P0-BE-07).
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.schemas.vendor_bill import VendorBillResponse, VendorBillListResponse
from app.schemas.payment import BillPayRequest, PaymentResponse
from app.services import vendor_bill_service, payment_service

# 'dependencies' parameter enforces route-level RBAC restricting vendor bill access to administrators and accountants
router = APIRouter(dependencies=[Depends(require_roles(["admin", "invoicing_user"]))])


# Queries paginated, filtered, and sorted vendor bills
@router.get("", response_model=VendorBillListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=VendorBillListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_vendor_bills(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (open, paid, partially_paid)"),
    vendor_id: Optional[int] = Query(None, description="Filter by Vendor Contact ID"),
    search: Optional[str] = Query(None, description="Search by bill number or Vendor name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (bill_number, bill_date, total, created_at, id)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
):
    """List Vendor Bills with optional filtering, sorting, and pagination."""
    bills, total, page, limit, pages = vendor_bill_service.list_vendor_bills(
        db,
        status=status_filter,
        vendor_id=vendor_id,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return VendorBillListResponse(data=bills, total=total, page=page, limit=limit, pages=pages)


# Fetches a specific vendor bill with its line items
@router.get("/{bill_id}", response_model=VendorBillResponse, status_code=status.HTTP_200_OK)
def get_vendor_bill(bill_id: int, db: Session = Depends(get_db)):
    """Get Vendor Bill detail by ID."""
    return vendor_bill_service.get_vendor_bill(db, bill_id)


# Direct bill payment endpoint to settle or partially pay an open vendor bill
@router.post("/{bill_id}/pay", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def pay_vendor_bill(
    bill_id: int,
    req: BillPayRequest,
    db: Session = Depends(get_db),
):
    """
    Record an outbound payment directly against a specific vendor bill.
    Posts the corresponding Journal Entry and updates the bill's paid balance and status.
    """
    return payment_service.create_outbound_payment(
        db=db,
        bill_id=bill_id,
        amount=req.amount,
        payment_method=req.payment_method,
        date=req.date,
        note=req.note,
    )


# Retrieves all payment history associated with a vendor bill
@router.get("/{bill_id}/payments", response_model=List[PaymentResponse], status_code=status.HTTP_200_OK)
def get_bill_payments(
    bill_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve all payment records logged against a specific vendor bill."""
    return payment_service.get_payments_for_bill(db, bill_id)


# Cancels an open vendor bill that has no existing payments
@router.patch("/{bill_id}/cancel", response_model=VendorBillResponse, status_code=status.HTTP_200_OK)
def cancel_vendor_bill(
    bill_id: int,
    db: Session = Depends(get_db),
):
    """Cancel an open Vendor Bill. Blocked if any payments have been made."""
    return vendor_bill_service.cancel_vendor_bill(db, bill_id)

