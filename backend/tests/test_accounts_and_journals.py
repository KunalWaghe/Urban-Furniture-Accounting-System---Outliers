"""
Unit & Integration tests for Chart of Accounts and Journals endpoints (P0-BE-04).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist before running tests."""
    Base.metadata.create_all(bind=engine)
    yield


def test_chart_of_accounts_endpoint():
    with TestClient(app) as client:
        # 1. Fetch all accounts -> expect 200 and auto-seeded defaults
        res = client.get("/api/v1/accounts")
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["total"] >= 8
        account_names = {a["name"] for a in data["data"]}
        assert "Cash" in account_names
        assert "Accounts Payable (Creditors)" in account_names
        assert "Sales Income" in account_names

        # 2. Filter by type=asset
        asset_res = client.get("/api/v1/accounts?type=asset")
        assert asset_res.status_code == 200
        asset_data = asset_res.json()
        assert asset_data["total"] >= 3
        assert all(a["type"] == "asset" for a in asset_data["data"])

        # 3. Filter by type=liability
        liab_res = client.get("/api/v1/accounts?type=liability")
        assert liab_res.status_code == 200
        liab_data = liab_res.json()
        assert liab_data["total"] >= 2
        assert all(a["type"] == "liability" for a in liab_data["data"])

        # 4. Search by account code
        search_res = client.get("/api/v1/accounts?search=1010")
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert len(search_data["data"]) == 1
        assert search_data["data"][0]["code"] == "1010"


def test_chart_of_accounts_crud_flow():
    with TestClient(app) as client:
        payload = {
            "code": "5020",
            "name": "Rent Expense",
            "type": "expense",
            "description": "Monthly office rent",
        }
        create_res = client.post("/api/v1/accounts", json=payload)
        assert create_res.status_code == 201, create_res.text
        created = create_res.json()
        assert created["code"] == "5020"
        assert created["name"] == "Rent Expense"
        assert created["is_active"] is True

        account_id = created["id"]

        get_res = client.get(f"/api/v1/accounts/{account_id}")
        assert get_res.status_code == 200
        assert get_res.json()["code"] == "5020"

        update_res = client.put(
            f"/api/v1/accounts/{account_id}",
            json={"name": "Office Rent Expense", "description": "Updated description"},
        )
        assert update_res.status_code == 200, update_res.text
        assert update_res.json()["name"] == "Office Rent Expense"

        dup_res = client.post(
            "/api/v1/accounts",
            json={"code": "5020", "name": "Duplicate", "type": "expense"},
        )
        assert dup_res.status_code == 409

        delete_res = client.delete(f"/api/v1/accounts/{account_id}")
        assert delete_res.status_code == 204

        inactive_res = client.get(f"/api/v1/accounts/{account_id}")
        assert inactive_res.status_code == 200
        assert inactive_res.json()["is_active"] is False


def test_journals_endpoint():
    with TestClient(app) as client:
        # 1. Fetch all journals -> expect 200 and 4 default journals with linked default accounts
        res = client.get("/api/v1/journals")
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["total"] >= 4
        journal_codes = {j["code"] for j in data["data"]}
        assert "SLS" in journal_codes
        assert "PUR" in journal_codes
        assert "BNK" in journal_codes
        assert "CSH" in journal_codes

        sls_journal = next(j for j in data["data"] if j["code"] == "SLS")
        assert sls_journal["default_account_id"] is not None
        assert sls_journal["default_account_name"] == "Sales Income"

        # 2. Filter by type=sale
        sale_res = client.get("/api/v1/journals?type=sale")
        assert sale_res.status_code == 200
        sale_data = sale_res.json()
        assert sale_data["total"] >= 1
        assert all(j["type"] == "sale" for j in sale_data["data"])
