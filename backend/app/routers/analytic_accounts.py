"""
Analytic Account API endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.analytic_account import AnalyticAccountListResponse
from app.services import analytic_account_service

router = APIRouter()


@router.get("", response_model=AnalyticAccountListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=AnalyticAccountListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_analytic_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List active analytic accounts with budget, committed, and remaining amounts."""
    return AnalyticAccountListResponse(data=analytic_account_service.list_analytic_accounts(db))
