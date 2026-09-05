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
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
):
    """
    Retrieve Journals (Sales, Purchase, Bank, Cash).
    
    Automatically seeds default journals on fresh databases.
    """
    journals, total = accounting_service.get_journals(db, journal_type=type, is_active=is_active)
    return JournalListResponse(data=journals, total=total)
