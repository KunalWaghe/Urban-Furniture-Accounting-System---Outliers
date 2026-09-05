"""
Unit and Integration tests for Financial Reporting (Profit & Loss and Balance Sheet) (Phase 5, P0-BE-08).
Includes test isolation cleanup, exact double-entry equilibrium checks, and schema validation.
"""

from datetime import datetime, timezone
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.models.account import Account
from app.models.journal_entry import JournalEntry, JournalItem
from app.services import report_service
from app.services.journal_engine import post_journal_entry
from app.services.accounting_service import seed_accounting_defaults


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure all database tables and default chart of accounts exist."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_accounting_defaults(db)
    finally:
        db.close()
    yield


# Tests HTTP endpoint for Profit & Loss statement structure and calculation consistency
def test_profit_loss_report_endpoint():
    """
    Test GET /api/v1/reports/profit-loss:
    - Returns 200 OK
    - Validates income, expenses, and net_income fields
    - Verifies net_income == income.total - expenses.total
    - Ensures standard accounts (4010, 5010) are present in lines even if zero balance
    """
    with TestClient(app) as client:
        res = client.get("/api/v1/reports/profit-loss")
        assert res.status_code == 200, res.text
        data = res.json()

        assert "income" in data
        assert "expenses" in data
        assert "net_income" in data

        income_lines = data["income"]["lines"]
        expense_lines = data["expenses"]["lines"]

        assert isinstance(income_lines, list)
        assert isinstance(expense_lines, list)

        # Confirm accounts 4010 and 5010 are present in their respective sections
        income_codes = [line["account_code"] for line in income_lines]
        expense_codes = [line["account_code"] for line in expense_lines]

        assert "4010" in income_codes
        assert "5010" in expense_codes

        computed_net = round(data["income"]["total"] - data["expenses"]["total"], 2)
        assert round(data["net_income"], 2) == computed_net


# Tests HTTP endpoint for Balance Sheet and confirms fundamental accounting equilibrium
def test_balance_sheet_report_endpoint_and_equilibrium():
    """
    Test GET /api/v1/reports/balance-sheet:
    - Returns 200 OK
    - Validates assets, liabilities, and capital categories
    - Asserts fundamental accounting equation: Assets == Liabilities + Capital exactly
    - Confirms is_balanced == True
    - Verifies Retained Earnings line exists in capital section and is flagged is_computed
    """
    with TestClient(app) as client:
        # Fetch P&L first to obtain reference Net Income
        pl_res = client.get("/api/v1/reports/profit-loss")
        assert pl_res.status_code == 200
        net_income = pl_res.json()["net_income"]

        # Fetch Balance Sheet
        bs_res = client.get("/api/v1/reports/balance-sheet")
        assert bs_res.status_code == 200, bs_res.text
        bs_data = bs_res.json()

        assets_total = bs_data["assets"]["total"]
        liabilities_total = bs_data["liabilities"]["total"]
        capital_total = bs_data["capital"]["total"]
        is_balanced = bs_data["is_balanced"]

        # Exact Double-entry invariant check
        expected_liab_cap = round(liabilities_total + capital_total, 2)
        assert is_balanced is True
        assert round(assets_total, 2) == expected_liab_cap

        # Check Retained Earnings line in Capital
        capital_lines = bs_data["capital"]["lines"]
        retained_line = next((l for l in capital_lines if l["account_name"] == "Retained Earnings"), None)
        assert retained_line is not None
        assert round(retained_line["balance"], 2) == round(net_income, 2)
        assert retained_line["is_computed"] is True
        assert retained_line["account_code"] == "3999"


# Tests fiscal year filtering functionality for both reports
def test_reports_fiscal_year_filter():
    """
    Test year parameter filtering on both P&L and Balance Sheet endpoints:
    - Queries for year 2026
    - Queries for a historical empty year (e.g. 1995) to ensure 0 totals and balanced state
    """
    with TestClient(app) as client:
        # 1. Current simulated year
        res_2026 = client.get("/api/v1/reports/profit-loss?year=2026")
        assert res_2026.status_code == 200
        assert res_2026.json()["year"] == 2026

        bs_2026 = client.get("/api/v1/reports/balance-sheet?year=2026")
        assert bs_2026.status_code == 200
        assert bs_2026.json()["year"] == 2026
        assert bs_2026.json()["is_balanced"] is True

        # 2. Year with no transactions
        res_empty = client.get("/api/v1/reports/profit-loss?year=1995")
        assert res_empty.status_code == 200
        empty_data = res_empty.json()
        assert empty_data["year"] == 1995
        assert empty_data["income"]["total"] == 0.0
        assert empty_data["expenses"]["total"] == 0.0
        assert empty_data["net_income"] == 0.0

        bs_empty = client.get("/api/v1/reports/balance-sheet?year=1995")
        assert bs_empty.status_code == 200
        bs_empty_data = bs_empty.json()
        assert bs_empty_data["year"] == 1995
        assert bs_empty_data["assets"]["total"] == 0.0
        assert bs_empty_data["liabilities"]["total"] == 0.0
        assert bs_empty_data["capital"]["total"] == 0.0
        assert bs_empty_data["is_balanced"] is True


# Direct unit tests of report service functions and double-entry sign conventions with isolated cleanup
def test_report_service_direct_units():
    """
    Unit test report_service internal functions:
    - get_account_balance with asset, liability, income, expense accounts
    - dynamic journal entry posting impacts balances correctly
    - cleans up created journal entry to guarantee zero state leakage across test runs
    """
    db = SessionLocal()
    created_entry_id = None
    try:
        # Look up accounts
        bank_acc = db.query(Account).filter(Account.code == "1020").first() # Asset
        sales_acc = db.query(Account).filter(Account.code == "4010").first() # Income

        assert bank_acc is not None
        assert sales_acc is not None

        bal_bank_before = report_service.get_account_balance(db, bank_acc.id)
        bal_sales_before = report_service.get_account_balance(db, sales_acc.id)

        # Post a direct balanced transaction with unique reference: Dr 1020 Bank 5,000 / Cr 4010 Sales 5,000
        unique_ref = f"TEST-ISO-{uuid.uuid4().hex[:8]}"
        entry = post_journal_entry(
            db=db,
            journal_code="SLS",
            reference=unique_ref,
            entry_date=datetime.now(timezone.utc),
            lines=[
                {"account_id": bank_acc.id, "debit": 5000.0, "credit": 0.0, "description": "Cash sale"},
                {"account_id": sales_acc.id, "debit": 0.0, "credit": 5000.0, "description": "Revenue"},
            ],
        )
        created_entry_id = entry.id

        bal_bank_after = report_service.get_account_balance(db, bank_acc.id)
        bal_sales_after = report_service.get_account_balance(db, sales_acc.id)

        assert round(bal_bank_after - bal_bank_before, 2) == 5000.0
        assert round(bal_sales_after - bal_sales_before, 2) == 5000.0

        # Verify Balance Sheet is still balanced
        bs = report_service.get_balance_sheet(db)
        assert bs.is_balanced is True
        assert round(bs.assets.total, 2) == round(bs.total_liabilities_and_capital, 2)

    finally:
        # Clean up the posted journal entry to maintain test isolation
        if created_entry_id:
            entry_to_del = db.get(JournalEntry, created_entry_id)
            if entry_to_del:
                db.delete(entry_to_del)
                db.commit()
        db.close()
