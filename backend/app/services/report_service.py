"""Financial report calculations backed by posted journal entries."""

from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.journal_entry import JournalEntry, JournalItem
from app.schemas.report import BalanceSheetLine, BalanceSheetResponse


def _money(value: Decimal | float | None) -> float:
    return round(float(value or 0), 2)


def get_balance_sheet(db: Session, as_of_date: date) -> BalanceSheetResponse:
    """Calculate account balances through the requested date.

    Assets and expenses are debit-normal. Liabilities, capital, and income are
    credit-normal. Current-period net income is included in capital so the
    accounting equation can be checked directly on the report.
    """
    cutoff = datetime.combine(as_of_date, time.max)
    posted_totals = (
        select(
            JournalItem.account_id.label("account_id"),
            func.sum(JournalItem.debit).label("debit"),
            func.sum(JournalItem.credit).label("credit"),
        )
        .join(JournalEntry, JournalEntry.id == JournalItem.journal_entry_id)
        .where(
            and_(
                JournalEntry.is_posted.is_(True),
                JournalEntry.date <= cutoff,
            )
        )
        .group_by(JournalItem.account_id)
        .subquery()
    )

    rows = db.execute(
        select(
            Account,
            func.coalesce(posted_totals.c.debit, 0),
            func.coalesce(posted_totals.c.credit, 0),
        )
        .outerjoin(posted_totals, posted_totals.c.account_id == Account.id)
        .where(Account.is_active.is_(True))
        .order_by(Account.code)
    ).all()

    assets: list[BalanceSheetLine] = []
    liabilities: list[BalanceSheetLine] = []
    capital: list[BalanceSheetLine] = []
    income_total = 0.0
    expense_total = 0.0

    for account, debit, credit in rows:
        debit_value = _money(debit)
        credit_value = _money(credit)
        account_type = account.type.lower()

        if account_type == "asset":
            balance = debit_value - credit_value
            if balance:
                assets.append(BalanceSheetLine(account_id=account.id, code=account.code, name=account.name, balance=balance))
        elif account_type == "liability":
            balance = credit_value - debit_value
            if balance:
                liabilities.append(BalanceSheetLine(account_id=account.id, code=account.code, name=account.name, balance=balance))
        elif account_type == "capital":
            balance = credit_value - debit_value
            if balance:
                capital.append(BalanceSheetLine(account_id=account.id, code=account.code, name=account.name, balance=balance))
        elif account_type == "income":
            income_total += credit_value - debit_value
        elif account_type in {"expense", "other_expense"}:
            expense_total += debit_value - credit_value

    net_income = round(income_total - expense_total, 2)
    total_assets = round(sum(line.balance for line in assets), 2)
    total_liabilities = round(sum(line.balance for line in liabilities), 2)
    total_capital = round(sum(line.balance for line in capital), 2)
    total_liabilities_and_capital = round(total_liabilities + total_capital + net_income, 2)

    return BalanceSheetResponse(
        as_of_date=as_of_date,
        assets=assets,
        liabilities=liabilities,
        capital=capital,
        net_income=net_income,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        total_capital=total_capital,
        total_liabilities_and_capital=total_liabilities_and_capital,
        balanced=abs(total_assets - total_liabilities_and_capital) < 0.01,
    )
