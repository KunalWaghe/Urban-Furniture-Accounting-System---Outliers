"""
Financial Reporting Service generating Balance Sheet and Profit & Loss statements (Phase 5, P0-BE-08).

Enterprise optimizations:
- Single-pass batch query (replaces O(N) queries with 2 queries total)
- Exact Decimal financial calculations preventing IEEE 754 float drift
- Exact double-entry equilibrium assertion without epsilon tolerance
- Read-only integrity: zero database seed side-effects on GET paths
- Clean Retained Earnings resolution with real account linking & is_computed tracking
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Dict, Tuple
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

TWOPLACES = Decimal("0.01")


def _to_decimal(val) -> Decimal:
    """Safely convert any numeric value to Decimal."""
    if val is None:
        return Decimal("0.00")
    return Decimal(str(val))


def _round_dec(val: Decimal) -> float:
    """Quantize a Decimal to 2 decimal places and return standard float for JSON serialization."""
    return float(val.quantize(TWOPLACES, rounding=ROUND_HALF_UP))


# Computes the net accounting balance for an individual account (kept for public API/tests)
def get_account_balance(db: Session, account_id: int, year: Optional[int] = None) -> float:
    """
    Calculate the net balance of an account from posted journal entries.
    - Asset / Expense: debit - credit (normal debit balance)
    - Liability / Income / Capital: credit - debit (normal credit balance)
    Only posted entries (`is_posted == True`) are considered.
    """
    query = (
        db.query(
            func.coalesce(func.sum(JournalItem.debit), 0.0),
            func.coalesce(func.sum(JournalItem.credit), 0.0),
        )
        .join(JournalEntry, JournalItem.journal_entry_id == JournalEntry.id)
        .filter(
            JournalItem.account_id == account_id,
            JournalEntry.is_posted == True,
        )
    )

    if year is not None:
        query = query.filter(extract("year", JournalEntry.date) == year)

    total_debit, total_credit = query.one()

    account = db.get(Account, account_id)
    if not account:
        return 0.0

    debit_dec = _to_decimal(total_debit)
    credit_dec = _to_decimal(total_credit)

    if account.type in ("asset", "expense"):
        net = debit_dec - credit_dec
    else:
        net = credit_dec - debit_dec

    return _round_dec(net)


def _fetch_ledger_balances(
    db: Session, year: Optional[int] = None
) -> Tuple[List[Account], Dict[int, Tuple[Decimal, Decimal]]]:
    """
    Execute exactly 2 database queries to fetch:
    1. All active Chart of Accounts ordered by code.
    2. Aggregated debit and credit totals grouped by account_id for posted entries.
    Eliminates N+1 query loops.
    """
    accounts = (
        db.query(Account)
        .filter(Account.is_active == True)
        .order_by(Account.code.asc())
        .all()
    )

    items_query = (
        db.query(
            JournalItem.account_id,
            func.coalesce(func.sum(JournalItem.debit), 0).label("total_debit"),
            func.coalesce(func.sum(JournalItem.credit), 0).label("total_credit"),
        )
        .join(JournalEntry, JournalItem.journal_entry_id == JournalEntry.id)
        .filter(JournalEntry.is_posted == True)
    )

    if year is not None:
        items_query = items_query.filter(extract("year", JournalEntry.date) == year)

    balance_map: Dict[int, Tuple[Decimal, Decimal]] = {
        row.account_id: (_to_decimal(row.total_debit), _to_decimal(row.total_credit))
        for row in items_query.group_by(JournalItem.account_id).all()
    }

    return accounts, balance_map


def _compute_account_balance_dec(account: Account, balance_map: Dict[int, Tuple[Decimal, Decimal]]) -> Decimal:
    """Calculate exact Decimal balance using normal balance accounting rules."""
    total_debit, total_credit = balance_map.get(account.id, (Decimal("0.00"), Decimal("0.00")))
    if account.type in ("asset", "expense"):
        return total_debit - total_credit
    else:  # liability, income, capital
        return total_credit - total_debit


# Compiles the Profit & Loss statement comparing income and operating expenses
def get_profit_loss(db: Session, year: Optional[int] = None) -> ProfitLossReport:
    """
    Generate Profit and Loss report in a single batch pass:
    - Income accounts (type == 'income')
    - Expense accounts (type == 'expense')
    - Net Income = Income Total - Expense Total
    Zero-balance accounts are retained to present a complete chart view.
    """
    accounts, balance_map = _fetch_ledger_balances(db, year=year)

    income_lines: List[ReportLine] = []
    expense_lines: List[ReportLine] = []

    income_total_dec = Decimal("0.00")
    expense_total_dec = Decimal("0.00")

    for acc in accounts:
        if acc.type == "income":
            bal_dec = _compute_account_balance_dec(acc, balance_map)
            income_total_dec += bal_dec
            income_lines.append(
                ReportLine(
                    account_id=acc.id,
                    account_code=acc.code,
                    account_name=acc.name,
                    balance=_round_dec(bal_dec),
                    is_computed=False,
                )
            )
        elif acc.type == "expense":
            bal_dec = _compute_account_balance_dec(acc, balance_map)
            expense_total_dec += bal_dec
            expense_lines.append(
                ReportLine(
                    account_id=acc.id,
                    account_code=acc.code,
                    account_name=acc.name,
                    balance=_round_dec(bal_dec),
                    is_computed=False,
                )
            )

    net_income_dec = income_total_dec - expense_total_dec

    return ProfitLossReport(
        year=year,
        income=ReportSection(lines=income_lines, total=_round_dec(income_total_dec)),
        expenses=ReportSection(lines=expense_lines, total=_round_dec(expense_total_dec)),
        net_income=_round_dec(net_income_dec),
    )


# Compiles the Balance Sheet report evaluating Assets == Liabilities + Capital
def get_balance_sheet(db: Session, year: Optional[int] = None) -> BalanceSheetReport:
    """
    Generate Balance Sheet financial statement:
    - Exactly 2 SQL queries total via batch aggregation (no N+1 and no double computation)
    - Groups accounts into Assets, Liabilities, and Capital
    - Incorporates current period Net Income into Capital as 'Retained Earnings'
    - Confirms exact double-entry balance equilibrium (Assets == Liabilities + Capital)
    """
    accounts, balance_map = _fetch_ledger_balances(db, year=year)

    asset_lines: List[ReportLine] = []
    liability_lines: List[ReportLine] = []
    capital_lines: List[ReportLine] = []

    assets_total_dec = Decimal("0.00")
    liabilities_total_dec = Decimal("0.00")
    capital_total_dec = Decimal("0.00")

    income_total_dec = Decimal("0.00")
    expense_total_dec = Decimal("0.00")

    retained_earnings_account: Optional[Account] = None
    retained_earnings_ledger_balance = Decimal("0.00")

    for acc in accounts:
        bal_dec = _compute_account_balance_dec(acc, balance_map)

        if acc.type == "asset":
            assets_total_dec += bal_dec
            asset_lines.append(
                ReportLine(
                    account_id=acc.id,
                    account_code=acc.code,
                    account_name=acc.name,
                    balance=_round_dec(bal_dec),
                    is_computed=False,
                )
            )
        elif acc.type == "liability":
            liabilities_total_dec += bal_dec
            liability_lines.append(
                ReportLine(
                    account_id=acc.id,
                    account_code=acc.code,
                    account_name=acc.name,
                    balance=_round_dec(bal_dec),
                    is_computed=False,
                )
            )
        elif acc.type == "capital":
            if acc.code == "3999":
                # Save Retained Earnings account to combine with dynamic Net Income
                retained_earnings_account = acc
                retained_earnings_ledger_balance = bal_dec
            else:
                capital_total_dec += bal_dec
                capital_lines.append(
                    ReportLine(
                        account_id=acc.id,
                        account_code=acc.code,
                        account_name=acc.name,
                        balance=_round_dec(bal_dec),
                        is_computed=False,
                    )
                )
        elif acc.type == "income":
            income_total_dec += bal_dec
        elif acc.type == "expense":
            expense_total_dec += bal_dec

    # Net income computed in-memory in the same pass (zero extra DB calls)
    net_income_dec = income_total_dec - expense_total_dec
    final_retained_earnings_dec = retained_earnings_ledger_balance + net_income_dec
    capital_total_dec += final_retained_earnings_dec

    # Inject Retained Earnings line item with real account_id if available
    capital_lines.append(
        ReportLine(
            account_id=retained_earnings_account.id if retained_earnings_account else None,
            account_code="3999",
            account_name="Retained Earnings",
            balance=_round_dec(final_retained_earnings_dec),
            is_computed=True,
        )
    )

    total_liab_and_capital_dec = liabilities_total_dec + capital_total_dec

    # Exact decimal equality assertion
    is_balanced = (assets_total_dec == total_liab_and_capital_dec)

    return BalanceSheetReport(
        year=year,
        assets=ReportSection(lines=asset_lines, total=_round_dec(assets_total_dec)),
        liabilities=ReportSection(lines=liability_lines, total=_round_dec(liabilities_total_dec)),
        capital=ReportSection(lines=capital_lines, total=_round_dec(capital_total_dec)),
        is_balanced=is_balanced,
        total_liabilities_and_capital=_round_dec(total_liab_and_capital_dec),
    )
