"""
Journal Entry API endpoints for General Ledger viewing and manual entries (P0-BE-11).
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.schemas.journal_entry import (
    JournalEntryCreate,
    JournalEntryResponse,
    JournalEntryListResponse,
)
from app.services import journal_entry_service

# 'dependencies' parameter enforces route-level authentication guards globally across general ledger journal operations
router = APIRouter(dependencies=[Depends(require_roles(["admin", "invoicing_user"]))])


# Handles HTTP GET requests to list, filter, and paginate general ledger journal entries
@router.get("", response_model=JournalEntryListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=JournalEntryListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_journal_entries(
    journal_id: Optional[int] = Query(None, description="Filter by Journal ID"),
    journal_code: Optional[str] = Query(None, description="Filter by Journal Code (e.g. PUR, SLS, BNK, CSH)"),
    is_posted: Optional[bool] = Query(None, description="Filter by posted status"),
    start_date: Optional[datetime] = Query(None, description="Filter entries on or after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter entries on or before this date"),
    search: Optional[str] = Query(None, description="Search by entry number or reference"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("date", description="Field to sort by (date, entry_number, total_amount, created_at, id)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
):
    entries, total, page, limit, pages = journal_entry_service.list_journal_entries(
        db=db,
        journal_id=journal_id,
        journal_code=journal_code,
        is_posted=is_posted,
        start_date=start_date,
        end_date=end_date,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return JournalEntryListResponse(data=entries, total=total, page=page, limit=limit, pages=pages)


# Handles HTTP POST requests to create and post a balanced manual journal entry
@router.post("", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_journal_entry(
    payload: JournalEntryCreate,
    db: Session = Depends(get_db),
):
    return journal_entry_service.create_manual_journal_entry(db, payload)


# Handles HTTP GET requests to fetch a specific journal entry by its primary key ID
@router.get("/{entry_id}", response_model=JournalEntryResponse, status_code=status.HTTP_200_OK)
def get_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
):
    return journal_entry_service.get_journal_entry_by_id(db, entry_id)
