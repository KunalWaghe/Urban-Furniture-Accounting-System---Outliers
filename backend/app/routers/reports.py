"""Financial reporting endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.report import BalanceSheetResponse
from app.services.report_service import get_balance_sheet

router = APIRouter()


@router.get("/balance-sheet", response_model=BalanceSheetResponse)
def balance_sheet(
    as_of_date: date | None = Query(None, description="Include posted entries through this date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the balance sheet equation through the requested date."""
    del current_user  # Authentication is required; report data is not role-specific.
    return get_balance_sheet(db, as_of_date or date.today())
