"""
Service logic for Analytic Accounts (budget analytics).
"""

from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.analytic_account import AnalyticAccount
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.schemas.analytic_account import AnalyticAccountResponse


def list_analytic_accounts(db: Session) -> List[AnalyticAccountResponse]:
    """List active analytic accounts with committed/remaining budget.

    committed = sum of PO line subtotals for that analytic on CONFIRMED POs.
    """
    committed_stmt = (
        select(
            PurchaseOrderLine.analytic_account_id,
            func.coalesce(func.sum(PurchaseOrderLine.subtotal), 0.0),
        )
        .join(PurchaseOrder, PurchaseOrderLine.po_id == PurchaseOrder.id)
        .where(
            PurchaseOrder.status == "confirmed",
            PurchaseOrderLine.analytic_account_id.isnot(None),
        )
        .group_by(PurchaseOrderLine.analytic_account_id)
    )
    committed_map = {row[0]: float(row[1]) for row in db.execute(committed_stmt).all()}

    accounts = db.scalars(
        select(AnalyticAccount)
        .where(AnalyticAccount.is_active == True)  # noqa: E712
        .order_by(AnalyticAccount.name)
    ).all()

    return [
        AnalyticAccountResponse(
            id=a.id,
            name=a.name,
            budget_amount=a.budget_amount,
            committed_amount=committed_map.get(a.id, 0.0),
            remaining_amount=a.budget_amount - committed_map.get(a.id, 0.0),
        )
        for a in accounts
    ]
