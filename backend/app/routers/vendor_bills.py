"""
Vendor Bill API endpoints (P0-BE-06).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.vendor_bill import VendorBillResponse, VendorBillListResponse
from app.services import vendor_bill_service

router = APIRouter()


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


@router.get("/{bill_id}", response_model=VendorBillResponse, status_code=status.HTTP_200_OK)
def get_vendor_bill(bill_id: int, db: Session = Depends(get_db)):
    """Get Vendor Bill detail by ID."""
    return vendor_bill_service.get_vendor_bill(db, bill_id)
