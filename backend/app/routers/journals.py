"""
Journals API endpoints (P0-BE-04).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.schemas.journal import JournalCreate, JournalUpdate, JournalResponse, JournalListResponse
from app.services import accounting_service

# RBAC guard: only admin and invoicing_user roles can access Journal management
router = APIRouter(dependencies=[Depends(require_roles(["admin", "invoicing_user"]))])


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=JournalResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_journal(req: JournalCreate, db: Session = Depends(get_db)):
    """Create a new journal."""
    return accounting_service.create_journal(db, req)


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


@router.get("/{journal_id}", response_model=JournalResponse, status_code=status.HTTP_200_OK)
def get_journal(journal_id: int, db: Session = Depends(get_db)):
    """Get journal details by ID."""
    return accounting_service.get_journal_by_id(db, journal_id)


@router.put("/{journal_id}", response_model=JournalResponse, status_code=status.HTTP_200_OK)
def update_journal(journal_id: int, req: JournalUpdate, db: Session = Depends(get_db)):
    """Update journal metadata or active status."""
    return accounting_service.update_journal(db, journal_id, req)


@router.delete("/{journal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal(journal_id: int, db: Session = Depends(get_db)):
    """Soft delete a journal (sets is_active=False)."""
    accounting_service.delete_journal(db, journal_id)
    return None

