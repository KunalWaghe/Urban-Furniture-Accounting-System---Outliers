"""
Financial Reporting Service generating Balance Sheet and Profit & Loss statements (Phase 5, P0-BE-08).
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.account import Account
from app.models.journal_entry import JournalEntry, JournalItem
from app.schemas.report import (
    ReportLine,
    ReportSection,
    ProfitLossReport,
    BalanceSheetReport,
)
from app.services.accounting_service import seed_accounting_defaults


# Computes the net accounting balance for an individual account
def get_account_balance(db: Session, account_id: int, year: Optional[int] = None) -> float:
    """
    Calculate the net balance of an account from posted journal entries.
    - Asset / Expense: debit - credit (normal debit balance)
    - Liability / Income / Capital: credit - debit (normal credit balance)
    Only posted entries (`is_posted == True`) are considered.
    """
    # 'func.coalesce' provides SQL COALESCE fallback to 0.0 when no matching records exist
    query = db.query(
        func.coalesce(func.sum(JournalItem.debit), 0.0),
        func.coalesce(func.sum(JournalItem.credit), 0.0),
    ).join(
        JournalEntry, JournalItem.journal_entry_id == JournalEntry.id
    ).filter(
        JournalItem.account_id == account_id,
        JournalEntry.is_posted == True,
    )

    # 'extract' evaluates SQL EXTRACT('year', date_col) to filter by reporting calendar year
    if year is not None:
        query = query.filter(extract("year", JournalEntry.date) == year)

    # 'query.one()' returns a tuple (total_debit, total_credit)
    total_debit, total_credit = query.one()

    # 'db.get' performs a direct primary-key lookup on the Account model
    account = db.get(Account, account_id)
    if not account:
        return 0.0

    # Apply double-entry natural sign convention based on account classification
    if account.type in ("asset", "expense"):
        return round(float(total_debit) - float(total_credit), 2)
    else:  # liability, income, capital
        return round(float(total_credit) - float(total_debit), 2)


# Compiles the Profit & Loss statement comparing income and operating expenses
def get_profit_loss(db: Session, year: Optional[int] = None) -> ProfitLossReport:
    """
    Generate Profit and Loss report:
    - Income accounts (type == 'income')
    - Expense accounts (type == 'expense')
    - Net Income = Income Total - Expense Total
    Zero-balance accounts are retained to present a complete chart view.
    """
    seed_accounting_defaults(db)

    # Retrieve all active income and expense accounts ordered by code
    income_accounts = (
        db.query(Account)
        .filter(Account.type == "income", Account.is_active == True)
        .order_by(Account.code.asc())
        .all()
    )
    expense_accounts = (
        db.query(Account)
        .filter(Account.type == "expense", Account.is_active == True)
        .order_by(Account.code.asc())
        .all()
    )

    income_lines: List[ReportLine] = []
    for acc in income_accounts:
        bal = get_account_balance(db, acc.id, year=year)
        income_lines.append(
            ReportLine(
                account_id=acc.id,
                account_code=acc.code,
                account_name=acc.name,
                balance=bal,
            )
        )

    expense_lines: List[ReportLine] = []
    for acc in expense_accounts:
        bal = get_account_balance(db, acc.id, year=year)
        expense_lines.append(
            ReportLine(
                account_id=acc.id,
                account_code=acc.code,
                account_name=acc.name,
                balance=bal,
            )
        )

    # Sum totals rounded to 2 decimal places to guard against IEEE 754 floating point drift
    income_total = round(sum(line.balance for line in income_lines), 2)
    expense_total = round(sum(line.balance for line in expense_lines), 2)
    net_income = round(income_total - expense_total, 2)

    return ProfitLossReport(
        year=year,
        income=ReportSection(lines=income_lines, total=income_total),
        expenses=ReportSection(lines=expense_lines, total=expense_total),
        net_income=net_income,
    )


# Compiles the Balance Sheet report evaluating Assets == Liabilities + Capital
def get_balance_sheet(db: Session, year: Optional[int] = None) -> BalanceSheetReport:
    """
    Generate Balance Sheet report:
    - Assets (type == 'asset')
    - Liabilities (type == 'liability')
    - Capital (type == 'capital' + Retained Earnings from Net Income)
    - Balance validation: is_balanced == True if Assets == Liabilities + Capital
    """
    seed_accounting_defaults(db)

    asset_accounts = (
        db.query(Account)
        .filter(Account.type == "asset", Account.is_active == True)
        .order_by(Account.code.asc())
        .all()
    )
    liability_accounts = (
        db.query(Account)
        .filter(Account.type == "liability", Account.is_active == True)
        .order_by(Account.code.asc())
        .all()
    )
    capital_accounts = (
        db.query(Account)
        .filter(Account.type == "capital", Account.is_active == True)
        .order_by(Account.code.asc())
        .all()
    )

    asset_lines: List[ReportLine] = [
        ReportLine(
            account_id=acc.id,
            account_code=acc.code,
            account_name=acc.name,
            balance=get_account_balance(db, acc.id, year=year),
        )
        for acc in asset_accounts
    ]

    liability_lines: List[ReportLine] = [
        ReportLine(
            account_id=acc.id,
            account_code=acc.code,
            account_name=acc.name,
            balance=get_account_balance(db, acc.id, year=year),
        )
        for acc in liability_accounts
    ]

    capital_lines: List[ReportLine] = [
        ReportLine(
            account_id=acc.id,
            account_code=acc.code,
            account_name=acc.name,
            balance=get_account_balance(db, acc.id, year=year),
        )
        for acc in capital_accounts
    ]

    # Incorporate Net Income from P&L into Capital as 'Retained Earnings' to balance the ledger
    pl = get_profit_loss(db, year=year)
    capital_lines.append(
        ReportLine(
            account_id=None,
            account_code="3999",
            account_name="Retained Earnings",
            balance=pl.net_income,
        )
    )

    assets_total = round(sum(l.balance for l in asset_lines), 2)
    liabilities_total = round(sum(l.balance for l in liability_lines), 2)
    capital_total = round(sum(l.balance for l in capital_lines), 2)
    total_liabilities_and_capital = round(liabilities_total + capital_total, 2)

    # Verification of accounting equation within standard rounding tolerance of 1 cent
    is_balanced = abs(round(assets_total - total_liabilities_and_capital, 2)) < 0.01

    return BalanceSheetReport(
        year=year,
        assets=ReportSection(lines=asset_lines, total=assets_total),
        liabilities=ReportSection(lines=liability_lines, total=liabilities_total),
        capital=ReportSection(lines=capital_lines, total=capital_total),
        is_balanced=is_balanced,
        total_liabilities_and_capital=total_liabilities_and_capital,
    )
