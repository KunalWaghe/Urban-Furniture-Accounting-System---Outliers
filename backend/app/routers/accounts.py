"""
Chart of Accounts API endpoints (P0-BE-04).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.account import AccountListResponse
from app.services import accounting_service

router = APIRouter()


@router.get("", response_model=AccountListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=AccountListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_accounts(
    type: Optional[str] = Query(None, description="Filter by account type (asset, liability, capital, income, expense)"),
    search: Optional[str] = Query(None, description="Search account code or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
):
    """
    Retrieve Chart of Accounts.
    
    Automatically seeds default account types (Asset, Liability, Capital, Income, Expense) on fresh databases.
    """
    accounts, total = accounting_service.get_accounts(db, account_type=type, search=search, is_active=is_active)
    return AccountListResponse(data=accounts, total=total)
