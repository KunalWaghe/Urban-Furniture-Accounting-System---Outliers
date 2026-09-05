"""
Analytic Account API endpoints for cost and revenue centre management (Phase 6, P1).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.analytic_account import (
    AnalyticAccountCreate,
    AnalyticAccountUpdate,
    AnalyticAccountResponse,
    AnalyticAccountListResponse,
)
from app.services import analytic_account_service

# 'APIRouter' organizes cost centre management routes for modular FastAPI mounting
router = APIRouter()


# Registers a new cost or revenue centre
@router.post("", response_model=AnalyticAccountResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AnalyticAccountResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_analytic_account(req: AnalyticAccountCreate, db: Session = Depends(get_db)):
    """Create a new Analytic Account cost or revenue centre."""
    return analytic_account_service.create_analytic_account(db, req)


# Queries paginated Analytic Accounts with filtering
@router.get("", response_model=AnalyticAccountListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=AnalyticAccountListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_analytic_accounts(
    # 'Query' parameter definitions ensure automated OpenAPI documentation and validation
    type: Optional[str] = Query(None, description="Filter by type (income, expense)"),
    search: Optional[str] = Query(None, description="Search by account name or code"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """Retrieve Analytic Accounts with optional filtering and pagination."""
    items, total, page, limit, pages = analytic_account_service.list_analytic_accounts(
        db, account_type=type, search=search, is_active=is_active, page=page, limit=limit
    )
    return AnalyticAccountListResponse(data=items, total=total, page=page, limit=limit, pages=pages)


# Fetches single Analytic Account by primary key ID
@router.get("/{account_id}", response_model=AnalyticAccountResponse, status_code=status.HTTP_200_OK)
def get_analytic_account(account_id: int, db: Session = Depends(get_db)):
    """Get Analytic Account details by ID."""
    return analytic_account_service.get_analytic_account(db, account_id)


# Updates fields or toggles active status of an Analytic Account
@router.put("/{account_id}", response_model=AnalyticAccountResponse, status_code=status.HTTP_200_OK)
def update_analytic_account(account_id: int, req: AnalyticAccountUpdate, db: Session = Depends(get_db)):
    """Update Analytic Account metadata."""
    return analytic_account_service.update_analytic_account(db, account_id, req)
