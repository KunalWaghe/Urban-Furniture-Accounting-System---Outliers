"""
Journals API endpoints (P0-BE-04).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.journal import JournalListResponse
from app.services import accounting_service

router = APIRouter()


@router.get("", response_model=JournalListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=JournalListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_journals(
    type: Optional[str] = Query(None, description="Filter by journal type (sale, purchase, bank, cash)"),
    search: Optional[str] = Query(None, description="Search journal code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("code", description="Field to sort by (code, name, type, id)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
):
    """
    Retrieve Journals (Sales, Purchase, Bank, Cash).
    
    Automatically seeds default journals on fresh databases.
    """
    journals, total, page, limit, pages = accounting_service.get_journals(
        db, journal_type=type, search=search, is_active=is_active, page=page, limit=limit, sort_by=sort_by, sort_order=sort_order
    )
    return JournalListResponse(data=journals, total=total, page=page, limit=limit, pages=pages)

