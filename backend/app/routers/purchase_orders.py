"""
Purchase Order API endpoints (P0-BE-05).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.purchase_order import POCreate, POResponse, POListResponse
from app.services import purchase_order_service

router = APIRouter()


@router.post("", response_model=POResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=POResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_purchase_order(req: POCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new Purchase Order in draft status."""
    return purchase_order_service.create_purchase_order(db, req)


@router.get("", response_model=POListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=POListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_purchase_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (draft, confirmed, cancelled)"),
    vendor_id: Optional[int] = Query(None, description="Filter by Vendor Contact ID"),
    search: Optional[str] = Query(None, description="Search by PO number or Vendor name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (po_number, order_date, total, created_at, id)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List Purchase Orders with optional filtering, sorting, and pagination."""
    pos, total, page, limit, pages = purchase_order_service.list_purchase_orders(
        db,
        status=status_filter,
        vendor_id=vendor_id,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return POListResponse(data=pos, total=total, page=page, limit=limit, pages=pages)


@router.get("/{po_id}", response_model=POResponse, status_code=status.HTTP_200_OK)
def get_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get Purchase Order detail by ID."""
    return purchase_order_service.get_purchase_order(db, po_id)


@router.put("/{po_id}", response_model=POResponse, status_code=status.HTTP_200_OK)
def update_purchase_order(po_id: int, req: POCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a draft Purchase Order (vendor, date, full line replacement)."""
    return purchase_order_service.update_purchase_order(db, po_id, req)


@router.patch("/{po_id}/confirm", response_model=POResponse, status_code=status.HTTP_200_OK)
def confirm_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Confirm a Purchase Order (draft -> confirmed)."""
    return purchase_order_service.confirm_purchase_order(db, po_id)


@router.patch("/{po_id}/cancel", response_model=POResponse, status_code=status.HTTP_200_OK)
def cancel_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cancel a Purchase Order (draft -> cancelled)."""
    return purchase_order_service.cancel_purchase_order(db, po_id)
