"""
Unit & Integration tests for Journal Engine posting and Journal Entries API (Phase 1, P0-BE-11).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.core.database import engine, Base, SessionLocal
from app.models.account import Account
from app.services.accounting_service import seed_accounting_defaults
from app.services.journal_engine import post_journal_entry
from app.core.exceptions import ValidationException


# Ensures test database schema exists and default chart of accounts is seeded prior to tests
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_accounting_defaults(db)
    # 'yield' keyword is used here to pause the fixture while the test runs and resume for teardown
    yield


# Verifies that a valid balanced manual journal entry posts successfully with status 201
def test_create_manual_journal_entry_success():
    with TestClient(app) as client:
        with SessionLocal() as db:
            cash_acct = db.scalar(select(Account).where(Account.code == "1010"))
            capital_acct = db.scalar(select(Account).where(Account.code == "3010"))

        payload = {
            "journal_code": "CSH",
            "reference": "INIT-INVESTMENT",
            "items": [
                {
                    "account_id": cash_acct.id,
                    "debit": 50000.0,
                    "credit": 0.0,
                    "description": "Owner cash investment",
                },
                {
                    "account_id": capital_acct.id,
                    "debit": 0.0,
                    "credit": 50000.0,
                    "description": "Owner equity capital contribution",
                },
            ],
        }

        res = client.post("/api/v1/journal-entries", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()

        assert data["entry_number"].startswith("JE-")
        assert data["reference"] == "INIT-INVESTMENT"
        assert data["total_amount"] == 50000.0
        assert data["is_posted"] is True
        assert len(data["items"]) == 2

        # Verify entry can be retrieved via GET endpoint
        get_res = client.get(f"/api/v1/journal-entries/{data['id']}")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["id"] == data["id"]
        assert get_data["entry_number"] == data["entry_number"]


# Verifies that submitting unbalanced debits and credits is rejected with HTTP 422
def test_create_manual_journal_entry_unbalanced_rejected():
    with TestClient(app) as client:
        with SessionLocal() as db:
            cash_acct = db.scalar(select(Account).where(Account.code == "1010"))
            capital_acct = db.scalar(select(Account).where(Account.code == "3010"))

        unbalanced_payload = {
            "journal_code": "CSH",
            "reference": "UNBALANCED-TEST",
            "items": [
                {
                    "account_id": cash_acct.id,
                    "debit": 1000.0,
                    "credit": 0.0,
                },
                {
                    "account_id": capital_acct.id,
                    "debit": 0.0,
                    "credit": 800.0,
                },
            ],
        }

        res = client.post("/api/v1/journal-entries", json=unbalanced_payload)
        assert res.status_code == 422


# Verifies that journal entries with fewer than two line items are rejected with HTTP 422
def test_create_manual_journal_entry_single_line_rejected():
    with TestClient(app) as client:
        with SessionLocal() as db:
            cash_acct = db.scalar(select(Account).where(Account.code == "1010"))

        single_line_payload = {
            "journal_code": "CSH",
            "reference": "SINGLE-LINE",
            "items": [
                {
                    "account_id": cash_acct.id,
                    "debit": 500.0,
                    "credit": 0.0,
                }
            ],
        }

        res = client.post("/api/v1/journal-entries", json=single_line_payload)
        assert res.status_code == 422


# Verifies that a line having both positive debit and positive credit amounts is rejected with HTTP 422
def test_create_manual_journal_entry_both_debit_credit_on_same_line_rejected():
    with TestClient(app) as client:
        with SessionLocal() as db:
            cash_acct = db.scalar(select(Account).where(Account.code == "1010"))
            capital_acct = db.scalar(select(Account).where(Account.code == "3010"))

        invalid_line_payload = {
            "journal_code": "CSH",
            "items": [
                {
                    "account_id": cash_acct.id,
                    "debit": 100.0,
                    "credit": 100.0,
                },
                {
                    "account_id": capital_acct.id,
                    "debit": 0.0,
                    "credit": 100.0,
                },
            ],
        }

        res = client.post("/api/v1/journal-entries", json=invalid_line_payload)
        assert res.status_code == 422


# Verifies that an entry referencing a non-existent account ID raises an appropriate validation error
def test_create_manual_journal_entry_nonexistent_account_rejected():
    with TestClient(app) as client:
        with SessionLocal() as db:
            cash_acct = db.scalar(select(Account).where(Account.code == "1010"))

        payload = {
            "journal_code": "CSH",
            "items": [
                {
                    "account_id": cash_acct.id,
                    "debit": 200.0,
                    "credit": 0.0,
                },
                {
                    "account_id": 999999,
                    "debit": 0.0,
                    "credit": 200.0,
                },
            ],
        }

        res = client.post("/api/v1/journal-entries", json=payload)
        assert res.status_code in (400, 422)


# Verifies listing and filtering journal entries by journal code and pagination envelope
def test_list_journal_entries_with_filter():
    with TestClient(app) as client:
        res = client.get("/api/v1/journal-entries?journal_code=CSH&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert isinstance(data["data"], list)


# Verifies that requesting a non-existent journal entry ID returns HTTP 404
def test_get_journal_entry_not_found():
    with TestClient(app) as client:
        res = client.get("/api/v1/journal-entries/999999")
        assert res.status_code == 404


# Directly tests unit-level post_journal_entry engine logic for transaction consistency
def test_direct_journal_engine_post():
    with SessionLocal() as db:
        cash_acct = db.scalar(select(Account).where(Account.code == "1010"))
        bank_acct = db.scalar(select(Account).where(Account.code == "1020"))

        lines = [
            {"account_id": cash_acct.id, "debit": 1500.0, "credit": 0.0, "description": "Cash withdrawal from bank"},
            {"account_id": bank_acct.id, "debit": 0.0, "credit": 1500.0, "description": "Bank account credit"},
        ]

        je = post_journal_entry(
            db=db,
            journal_code="CSH",
            reference="CASH-TRANSFER",
            lines=lines,
            is_posted=True,
        )
        db.commit()

        assert je.id is not None
        assert je.total_amount == 1500.0
        assert je.entry_number.startswith("JE-")


# Verifies that vendor_bill_service.create_bill_from_po seamlessly generates balanced journal entries via the engine
def test_vendor_bill_integration_with_journal_engine():
    import uuid
    from app.models.contact import Contact
    from app.models.product import Product
    from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
    from app.services.vendor_bill_service import create_bill_from_po

    uid = uuid.uuid4().hex[:6]
    with SessionLocal() as db:
        vendor = Contact(name=f"Vendor {uid}", type="vendor", email=f"vendor_{uid}@test.com")
        product = Product(name=f"Timber {uid}", price=100.0, cost=50.0, product_type="goods")
        db.add(vendor)
        db.add(product)
        # 'flush' keyword is used here to generate vendor.id and product.id before creating the purchase order
        db.flush()

        po = PurchaseOrder(
            po_number=f"PO-ENG-{uid}",
            vendor_id=vendor.id,
            total=250.0,
            status="confirmed",
        )
        db.add(po)
        db.flush()

        po_line = PurchaseOrderLine(
            po_id=po.id,
            product_id=product.id,
            quantity=5.0,
            unit_price=50.0,
            subtotal=250.0,
        )
        db.add(po_line)
        db.commit()

        # Execute create_bill_from_po which now calls our unified journal engine
        bill_resp = create_bill_from_po(db, po.id)

        assert bill_resp.bill.bill_number.startswith("BILL-")
        assert bill_resp.journal_entry.entry_number.startswith("JE-")
        assert bill_resp.journal_entry.total_amount == 250.0
        assert len(bill_resp.journal_entry.items) == 2
        debits = sum(it.debit for it in bill_resp.journal_entry.items)
        credits = sum(it.credit for it in bill_resp.journal_entry.items)
        assert debits == credits == 250.0

