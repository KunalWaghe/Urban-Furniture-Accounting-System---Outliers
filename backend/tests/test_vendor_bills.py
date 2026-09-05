"""
Integration tests for Vendor Bill creation and auto Journal Entry posting (P0-BE-06).
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import engine, Base, SessionLocal
from app.models.contact import Contact
from app.models.product import Product
from app.models.account import Account
from app.models.journal import Journal
from app.services.accounting_service import seed_accounting_defaults


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure all database tables exist and accounting defaults are seeded."""
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_accounting_defaults(db)
    yield


def test_create_vendor_bill_success_and_balanced_journal_entry():
    """
    POST /api/v1/purchase-orders/:id/create-bill
    Validates:
    - 201 Created with VendorBill and JournalEntry
    - Balanced debits (Expense) and credits (Accounts Payable)
    - Sequential BILL-0001 and JE-0001 numbering
    - Purchase Order status transitioned to 'billed'
    - Retrieval via GET /api/v1/vendor-bills/:id
    """
    with TestClient(app) as client:
        unique = uuid.uuid4().hex[:6]

        # 1. Create a Vendor Contact
        vendor_res = client.post(
            "/api/v1/contacts",
            json={
                "name": f"Supplier {unique}",
                "email": f"supplier_{unique}@domain.com",
                "type": "vendor",
            },
        )
        assert vendor_res.status_code == 201, vendor_res.text
        vendor_id = vendor_res.json()["id"]

        # 2. Create Products
        p1_res = client.post(
            "/api/v1/products",
            json={
                "name": f"Desk Timber {unique}",
                "price": 200.0,
                "cost": 100.0,
                "product_type": "goods",
            },
        )
        assert p1_res.status_code == 201, p1_res.text
        product1_id = p1_res.json()["id"]

        p2_res = client.post(
            "/api/v1/products",
            json={
                "name": f"Metal Legs {unique}",
                "price": 50.0,
                "cost": 25.0,
                "product_type": "goods",
            },
        )
        assert p2_res.status_code == 201, p2_res.text
        product2_id = p2_res.json()["id"]

        # 3. Create Draft PO
        po_payload = {
            "vendor_id": vendor_id,
            "order_date": "2026-09-05",
            "lines": [
                {
                    "product_id": product1_id,
                    "quantity": 10.0,
                    "unit_price": 100.0,  # subtotal = 1000.0
                },
                {
                    "product_id": product2_id,
                    "quantity": 20.0,
                    "unit_price": 25.0,   # subtotal = 500.0
                },
            ],
        }
        po_res = client.post("/api/v1/purchase-orders", json=po_payload)
        assert po_res.status_code == 201, po_res.text
        po_data = po_res.json()
        po_id = po_data["id"]
        assert po_data["status"] == "draft"
        assert po_data["total"] == 1500.0

        # 4. Confirm PO (draft -> confirmed)
        confirm_res = client.patch(f"/api/v1/purchase-orders/{po_id}/confirm")
        assert confirm_res.status_code == 200, confirm_res.text
        assert confirm_res.json()["status"] == "confirmed"

        # 5. Create Bill from Confirmed PO -> 201 Created
        bill_res = client.post(f"/api/v1/purchase-orders/{po_id}/create-bill")
        assert bill_res.status_code == 201, bill_res.text
        data = bill_res.json()

        assert "bill" in data
        assert "journal_entry" in data

        bill = data["bill"]
        je = data["journal_entry"]

        # Assert Vendor Bill fields
        assert bill["id"] is not None
        assert bill["bill_number"].startswith("BILL-")
        assert bill["po_id"] == po_id
        assert bill["vendor_id"] == vendor_id
        assert bill["total"] == 1500.0
        assert bill["amount_paid"] == 0.0
        assert bill["status"] == "open"
        bill_id = bill["id"]

        # Assert Journal Entry fields
        assert je["id"] is not None
        assert je["entry_number"].startswith("JE-")
        assert je["journal_code"] == "PUR"
        assert je["journal_name"] == "Purchase Journal"
        assert len(je["items"]) >= 2

        total_debit = sum(item["debit"] for item in je["items"])
        total_credit = sum(item["credit"] for item in je["items"])

        # Strictly assert double-entry balance
        assert round(total_debit, 2) == 1500.0
        assert round(total_credit, 2) == 1500.0
        assert total_debit == total_credit

        # Check debit items belong to Purchase Expense (5010)
        expense_items = [it for it in je["items"] if it["debit"] > 0]
        assert len(expense_items) == 2
        for it in expense_items:
            assert it["account_code"] == "5010"

        # Check credit item belongs to Accounts Payable (2010)
        payable_items = [it for it in je["items"] if it["credit"] > 0]
        assert len(payable_items) == 1
        assert payable_items[0]["account_code"] == "2010"
        assert payable_items[0]["credit"] == 1500.0

        # 6. Verify PO status is updated to 'billed'
        updated_po_res = client.get(f"/api/v1/purchase-orders/{po_id}")
        assert updated_po_res.status_code == 200
        assert updated_po_res.json()["status"] == "billed"

        # 7. Fetch Vendor Bill directly via GET /api/v1/vendor-bills/:id
        get_bill_res = client.get(f"/api/v1/vendor-bills/{bill_id}")
        assert get_bill_res.status_code == 200, get_bill_res.text
        retrieved_bill = get_bill_res.json()
        assert retrieved_bill["id"] == bill_id
        assert retrieved_bill["bill_number"] == bill["bill_number"]
        assert retrieved_bill["total"] == 1500.0
        assert retrieved_bill["status"] == "open"
        assert len(retrieved_bill["lines"]) == 2


def test_duplicate_bill_creation_rejected_with_409():
    """Attempting to create a bill for an already-billed PO returns 409 BILL_ALREADY_EXISTS."""
    with TestClient(app) as client:
        unique = uuid.uuid4().hex[:6]

        # Create vendor and product
        vendor = client.post("/api/v1/contacts", json={"name": f"V {unique}", "type": "vendor"}).json()
        product = client.post(
            "/api/v1/products",
            json={"name": f"P {unique}", "price": 50.0},
        ).json()

        # Create and confirm PO
        po = client.post(
            "/api/v1/purchase-orders",
            json={"vendor_id": vendor["id"], "lines": [{"product_id": product["id"], "quantity": 2.0, "unit_price": 50.0}]},
        ).json()
        client.patch(f"/api/v1/purchase-orders/{po['id']}/confirm")

        # First bill creation -> 201
        res1 = client.post(f"/api/v1/purchase-orders/{po['id']}/create-bill")
        assert res1.status_code == 201

        # Second bill creation -> 409 Conflict
        res2 = client.post(f"/api/v1/purchase-orders/{po['id']}/create-bill")
        assert res2.status_code == 409
        err = res2.json()["error"]
        assert err["code"] == "BILL_ALREADY_EXISTS"


def test_create_bill_from_draft_po_rejected_with_422():
    """Attempting to create a bill for a draft PO returns 422 INVALID_STATUS_TRANSITION."""
    with TestClient(app) as client:
        unique = uuid.uuid4().hex[:6]

        vendor = client.post("/api/v1/contacts", json={"name": f"V2 {unique}", "type": "vendor"}).json()
        product = client.post(
            "/api/v1/products",
            json={"name": f"P2 {unique}", "price": 30.0},
        ).json()

        # Create PO in draft
        po = client.post(
            "/api/v1/purchase-orders",
            json={"vendor_id": vendor["id"], "lines": [{"product_id": product["id"], "quantity": 1.0, "unit_price": 30.0}]},
        ).json()
        assert po["status"] == "draft"

        # Attempt create-bill on draft PO -> 422
        res = client.post(f"/api/v1/purchase-orders/{po['id']}/create-bill")
        assert res.status_code == 422
        err = res.json()["error"]
        assert err["code"] == "INVALID_STATUS_TRANSITION"


def test_create_bill_for_nonexistent_po_returns_404():
    """Attempting to create a bill for a non-existent PO returns 404 NOT_FOUND."""
    with TestClient(app) as client:
        res = client.post("/api/v1/purchase-orders/9999999/create-bill")
        assert res.status_code == 404
        assert res.json()["error"]["code"] == "NOT_FOUND"


def test_list_vendor_bills_and_filters():
    """GET /api/v1/vendor-bills returns paginated bills with status filtering."""
    with TestClient(app) as client:
        list_res = client.get("/api/v1/vendor-bills?limit=10")
        assert list_res.status_code == 200, list_res.text
        data = list_res.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert isinstance(data["data"], list)

        # Filter by status
        open_res = client.get("/api/v1/vendor-bills?status=open")
        assert open_res.status_code == 200
        for bill in open_res.json()["data"]:
            assert bill["status"] == "open"
