"""
Financial Reporting API routes for Profit & Loss and Balance Sheet statements (Phase 5, P0-BE-08).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.schemas.report import ProfitLossReport, BalanceSheetReport, BudgetReportResponse
from app.services import report_service, budget_service

# RBAC guard: only admin and invoicing_user roles can access financial reports
router = APIRouter(dependencies=[Depends(require_roles(["admin", "invoicing_user"]))])


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


# Retrieves the Budget performance report with achieved metrics per budget
@router.get("/budget", response_model=BudgetReportResponse, status_code=status.HTTP_200_OK)
def get_budget_report(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by budget status (draft, confirmed, revised, cancelled)"),
    db: Session = Depends(get_db),
):
    """
    Generate Budget performance report.
    - Lists all budgets with live achieved amounts computed from ledger postings
    - Provides aggregated totals across all budgets
    - Supports filtering by budget status
    """
    from app.schemas.report import BudgetReportItem

    items, total, page, limit, pages = budget_service.list_budgets(
        db, status=status_filter, page=1, limit=100,
    )

    budget_items = []
    total_committed = 0.0
    total_achieved = 0.0

    for b in items:
        budget_items.append(BudgetReportItem(
            id=b.id,
            name=b.name,
            analytic_account_name=b.analytic_account_name,
            period_start=str(b.period_start) if b.period_start else "",
            period_end=str(b.period_end) if b.period_end else "",
            status=b.status,
            committed_amount=b.committed_amount,
            achieved_amount=b.achieved_amount or 0.0,
            achieved_pct=b.achieved_pct or 0.0,
            amount_to_achieve=b.amount_to_achieve or 0.0,
        ))
        total_committed += b.committed_amount
        total_achieved += (b.achieved_amount or 0.0)

    overall_pct = round((total_achieved / total_committed) * 100, 2) if total_committed > 0 else 0.0

    return BudgetReportResponse(
        budgets=budget_items,
        total_committed=round(total_committed, 2),
        total_achieved=round(total_achieved, 2),
        overall_achieved_pct=overall_pct,
    )

