"""
Financial Reporting API routes for Profit & Loss and Balance Sheet statements (Phase 5, P0-BE-08).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.report import ProfitLossReport, BalanceSheetReport
from app.services import report_service

# 'APIRouter' encapsulates all financial reporting HTTP endpoints for modular mounting
router = APIRouter()


# Retrieves the Profit & Loss statement comparing operating income against expenses
@router.get("/profit-loss", response_model=ProfitLossReport, status_code=status.HTTP_200_OK)
def get_profit_and_loss_report(
    # 'Query' extracts and validates the optional fiscal year parameter from the query string
    year: Optional[int] = Query(None, description="Fiscal calendar year filter (e.g. 2026)"),
    # 'Depends' injects a scoped database session managed by the request lifecycle
    db: Session = Depends(get_db),
):
    """
    Generate Profit and Loss (Income Statement) report.
    - Compares Income (4000 series) against Expenses (5000 series)
    - Returns Net Income = Total Income - Total Expenses
    - If `year` is omitted, aggregates all-time ledger entries.
    """
    return report_service.get_profit_loss(db=db, year=year)


# Retrieves the Balance Sheet report validating Assets == Liabilities + Capital
@router.get("/balance-sheet", response_model=BalanceSheetReport, status_code=status.HTTP_200_OK)
def get_balance_sheet_report(
    # 'Query' extracts and validates the optional fiscal year parameter from the query string
    year: Optional[int] = Query(None, description="Fiscal calendar year filter (e.g. 2026)"),
    # 'Depends' injects a scoped database session managed by the request lifecycle
    db: Session = Depends(get_db),
):
    """
    Generate Balance Sheet financial statement.
    - Groups accounts into Assets, Liabilities, and Capital
    - Injects current Net Income into Capital as 'Retained Earnings'
    - Confirms ledger equilibrium with `is_balanced` (Assets == Liabilities + Capital)
    - If `year` is omitted, aggregates all-time ledger entries.
    """
    return report_service.get_balance_sheet(db=db, year=year)
