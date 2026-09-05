"""
Budget API endpoints for financial allocations, tracking, and revision workflows (Phase 6, P1).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.budget import (
    BudgetCreate,
    BudgetRevise,
    BudgetResponse,
    BudgetListResponse,
)
from app.services import budget_service

# 'APIRouter' handles budget creation, lifecycle updates, and real-time ledger variance queries
router = APIRouter()


# Creates a new draft Budget
@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_budget(req: BudgetCreate, db: Session = Depends(get_db)):
    """Create a new Budget in 'draft' status."""
    return budget_service.create_budget(db, req)


# Lists paginated Budgets with filtering and live performance calculation
@router.get("", response_model=BudgetListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=BudgetListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_budgets(
    # 'Query' parameter definitions ensure automated OpenAPI documentation and validation
    analytic_account_id: Optional[int] = Query(None, description="Filter by Analytic Account ID"),
    status: Optional[str] = Query(None, description="Filter by status (draft, confirmed, revised, cancelled)"),
    search: Optional[str] = Query(None, description="Search by budget title"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """List budgets with computed performance statistics (achieved amount, achieved %, headroom)."""
    items, total, page, limit, pages = budget_service.list_budgets(
        db,
        analytic_account_id=analytic_account_id,
        status=status,
        search=search,
        page=page,
        limit=limit,
    )
    return BudgetListResponse(data=items, total=total, page=page, limit=limit, pages=pages)


# Fetches a specific Budget by primary key ID along with performance analytics
@router.get("/{budget_id}", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    """Get Budget details with computed variance metrics by ID."""
    return budget_service.get_budget(db, budget_id)


# Confirms a draft Budget
@router.patch("/{budget_id}/confirm", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def confirm_budget(budget_id: int, db: Session = Depends(get_db)):
    """Confirm a Budget (draft -> confirmed)."""
    return budget_service.confirm_budget(db, budget_id)


# Creates a formal revision row branching off an existing confirmed Budget
@router.post("/{budget_id}/revise", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def revise_budget(budget_id: int, req: BudgetRevise, db: Session = Depends(get_db)):
    """Create a new revision from a confirmed Budget."""
    return budget_service.revise_budget(db, budget_id, req)


# Cancels an unconfirmed draft Budget
@router.patch("/{budget_id}/cancel", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def cancel_budget(budget_id: int, db: Session = Depends(get_db)):
    """Cancel a draft Budget."""
    return budget_service.cancel_budget(db, budget_id)
