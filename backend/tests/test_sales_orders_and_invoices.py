"""
Unit & Integration tests for Sales Orders and Customer Invoices (Phase 3).
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.core.database import engine, Base, SessionLocal
from app.models.contact import Contact
from app.models.product import Product
from app.models.account import Account
from app.models.sales_order import SalesOrder, SalesOrderLine
from app.models.customer_invoice import CustomerInvoice, CustomerInvoiceLine
from app.models.journal_entry import JournalEntry, JournalItem
from app.services.accounting_service import seed_accounting_defaults


# Fixture ensuring database tables and default chart of accounts are seeded before test execution
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_accounting_defaults(db)
    # 'yield' pauses fixture execution during the test and handles teardown afterwards
    yield


# Helper to create a customer contact and product in the test database session
def _setup_customer_and_product(price: float = 500.0):
    with SessionLocal() as db:
        unique = uuid.uuid4().hex[:6]
        customer = Contact(
            name=f"Customer {unique}",
            email=f"cust_{unique}@testdomain.com",
            type="customer",
        )
        db.add(customer)
        db.flush()

        product = Product(
            name=f"Executive Chair {unique}",
            price=price,
            cost=price * 0.6,
            product_type="goods",
        )
        db.add(product)
        db.commit()
        return customer.id, product.id


# Tests the complete lifecycle of a Sales Order: creation, retrieval, confirmation, and listing
def test_sales_order_lifecycle():
    customer_id, product_id = _setup_customer_and_product(price=250.0)

    with TestClient(app) as client:
        # 1. Create a draft Sales Order with 2 units of product
        create_payload = {
            "customer_id": customer_id,
            "lines": [
                {
                    "product_id": product_id,
                    "quantity": 2.0,
                    "unit_price": 250.0,
                }
            ],
        }
        res = client.post("/api/v1/sales-orders", json=create_payload)
        assert res.status_code == 201, res.text
        data = res.json()

        assert data["so_number"].startswith("SO-")
        assert data["customer_id"] == customer_id
        assert data["status"] == "draft"
        assert data["total"] == 500.0
        assert len(data["lines"]) == 1
        assert data["lines"][0]["subtotal"] == 500.0
        so_id = data["id"]

        # 2. Retrieve Sales Order by ID
        get_res = client.get(f"/api/v1/sales-orders/{so_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == so_id

        # 3. Confirm the Sales Order (draft -> confirmed)
        confirm_res = client.patch(f"/api/v1/sales-orders/{so_id}/confirm")
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "confirmed"

        # 4. List Sales Orders with status filter
        list_res = client.get("/api/v1/sales-orders?status=confirmed")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert any(order["id"] == so_id for order in list_data["data"])


# Tests validation rules: rejecting missing customers, empty lines, and negative numbers
def test_sales_order_validation_errors():
    _, product_id = _setup_customer_and_product()

    with TestClient(app) as client:
        # Reject empty lines list (min_length=1 constraint)
        bad_payload_empty = {
            "customer_id": 1,
            "lines": [],
        }
        res = client.post("/api/v1/sales-orders", json=bad_payload_empty)
        assert res.status_code == 422

        # Reject negative quantity (gt=0 constraint)
        bad_payload_qty = {
            "customer_id": 1,
            "lines": [
                {"product_id": product_id, "quantity": -5.0, "unit_price": 100.0}
            ],
        }
        res = client.post("/api/v1/sales-orders", json=bad_payload_qty)
        assert res.status_code == 422

        # Reject non-existent customer (404 NotFoundException)
        bad_payload_cust = {
            "customer_id": 999999,
            "lines": [
                {"product_id": product_id, "quantity": 1.0, "unit_price": 100.0}
            ],
        }
        res = client.post("/api/v1/sales-orders", json=bad_payload_cust)
        assert res.status_code == 404


# Verifies converting a confirmed Sales Order into a Customer Invoice with balanced double-entry
def test_create_customer_invoice_success_and_balanced_journal_entry():
    customer_id, product_id = _setup_customer_and_product(price=1200.0)

    with TestClient(app) as client:
        # Create and confirm Sales Order
        create_res = client.post(
            "/api/v1/sales-orders",
            json={
                "customer_id": customer_id,
                "lines": [{"product_id": product_id, "quantity": 1.0, "unit_price": 1200.0}],
            },
        )
        so_id = create_res.json()["id"]
        client.patch(f"/api/v1/sales-orders/{so_id}/confirm")

        # Convert to Customer Invoice
        inv_res = client.post(f"/api/v1/sales-orders/{so_id}/create-invoice")
        assert inv_res.status_code == 201, inv_res.text
        inv_data = inv_res.json()

        # Check Customer Invoice fields
        invoice = inv_data["invoice"]
        assert invoice["invoice_number"].startswith("INV-")
        assert invoice["so_id"] == so_id
        assert invoice["customer_id"] == customer_id
        assert invoice["total"] == 1200.0
        assert invoice["amount_paid"] == 0.0
        assert invoice["status"] == "open"
        assert invoice["journal_entry_id"] is not None
        invoice_id = invoice["id"]

        # Check Journal Entry integrity: SLS journal, Dr 1030 (Debtors) / Cr 4010 (Sales Income)
        je = inv_data["journal_entry"]
        assert je["journal_code"] == "SLS"
        assert je["total_amount"] == 1200.0
        assert len(je["items"]) == 2

        # Verify balanced debits and credits
        total_debit = round(sum(item["debit"] for item in je["items"]), 2)
        total_credit = round(sum(item["credit"] for item in je["items"]), 2)
        assert total_debit == 1200.0
        assert total_credit == 1200.0

        # Verify Debtors (1030) is debited
        dr_item = next(it for it in je["items"] if it["debit"] > 0)
        assert dr_item["account_code"] == "1030"
        assert dr_item["debit"] == 1200.0
        assert dr_item["credit"] == 0.0

        # Verify Sales Income (4010) is credited
        cr_item = next(it for it in je["items"] if it["credit"] > 0)
        assert cr_item["account_code"] == "4010"
        assert cr_item["debit"] == 0.0
        assert cr_item["credit"] == 1200.0

        # Verify Sales Order status transitioned to 'invoiced'
        so_check = client.get(f"/api/v1/sales-orders/{so_id}")
        assert so_check.json()["status"] == "invoiced"

        # Verify GET /api/v1/customer-invoices/{invoice_id}
        get_inv = client.get(f"/api/v1/customer-invoices/{invoice_id}")
        assert get_inv.status_code == 200
        assert get_inv.json()["invoice_number"] == invoice["invoice_number"]

        # Verify GET /api/v1/customer-invoices listing
        list_inv = client.get("/api/v1/customer-invoices")
        assert list_inv.status_code == 200
        assert any(i["id"] == invoice_id for i in list_inv.json()["data"])


# Verifies that creating a duplicate invoice for the same Sales Order is rejected with 409 Conflict
def test_duplicate_invoice_creation_rejected_with_409():
    customer_id, product_id = _setup_customer_and_product(price=300.0)

    with TestClient(app) as client:
        create_res = client.post(
            "/api/v1/sales-orders",
            json={
                "customer_id": customer_id,
                "lines": [{"product_id": product_id, "quantity": 1.0, "unit_price": 300.0}],
            },
        )
        so_id = create_res.json()["id"]
        client.patch(f"/api/v1/sales-orders/{so_id}/confirm")

        # First invoice creation succeeds
        res1 = client.post(f"/api/v1/sales-orders/{so_id}/create-invoice")
        assert res1.status_code == 201

        # Second invoice creation attempt must fail with 409 Conflict
        res2 = client.post(f"/api/v1/sales-orders/{so_id}/create-invoice")
        assert res2.status_code == 409


# Verifies that attempting to create an invoice from a draft Sales Order is rejected with 422
def test_create_invoice_from_draft_so_rejected_with_422():
    customer_id, product_id = _setup_customer_and_product(price=400.0)

    with TestClient(app) as client:
        # Create draft SO but do not confirm it
        create_res = client.post(
            "/api/v1/sales-orders",
            json={
                "customer_id": customer_id,
                "lines": [{"product_id": product_id, "quantity": 1.0, "unit_price": 400.0}],
            },
        )
        so_id = create_res.json()["id"]

        # Attempt to invoice unconfirmed SO
        res = client.post(f"/api/v1/sales-orders/{so_id}/create-invoice")
        assert res.status_code in (400, 422)
