"""
Unit & Integration tests for Purchase Order endpoints (P0-BE-05).
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base, SessionLocal


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist before running tests."""
    Base.metadata.create_all(bind=engine)
    yield


def auth_headers(client: TestClient) -> dict:
    """Register a fresh user and return Authorization headers for it."""
    unique = uuid.uuid4().hex[:8]
    res = client.post(
        "/api/v1/auth/register",
        json={
            "login_id": f"po{unique}",
            "email": f"po_{unique}@example.com",
            "password": "SecurePass123!",
            "name": "PO Tester",
        },
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}


def create_vendor(client: TestClient, headers: dict) -> int:
    res = client.post(
        "/api/v1/contacts",
        headers=headers,
        json={
            "name": f"Vendor {uuid.uuid4().hex[:6]}",
            "type": "vendor",
            "email": "vendor@example.com",
            "mobile": "9876543210",
            "city": "Mumbai",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


def create_product(client: TestClient, headers: dict) -> int:
    res = client.post(
        "/api/v1/products",
        headers=headers,
        json={
            "name": f"Product {uuid.uuid4().hex[:6]}",
            "product_type": "goods",
            "category": "Furniture",
            "price": 1500.00,
            "cost": 1000.00,
            "tax_percent": 18.0,
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


def create_draft_po(client: TestClient, headers: dict, vendor_id: int, product_id: int, quantity: float = 10, unit_price: float = 1000.00, analytic_account_id=None) -> dict:
    payload = {
        "vendor_id": vendor_id,
        "lines": [
            {
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "analytic_account_id": analytic_account_id,
            }
        ],
    }
    res = client.post("/api/v1/purchase-orders", headers=headers, json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_purchase_order_lifecycle():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)

        po_data = create_draft_po(client, headers, vendor_id, product_id)

        assert po_data["po_number"].startswith("PO-")
        assert po_data["vendor_id"] == vendor_id
        assert po_data["status"] == "draft"
        assert po_data["total"] == 10000.00
        assert len(po_data["lines"]) == 1
        assert po_data["lines"][0]["subtotal"] == 10000.00

        po_id = po_data["id"]

        get_res = client.get(f"/api/v1/purchase-orders/{po_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["po_number"] == po_data["po_number"]

        list_res = client.get("/api/v1/purchase-orders", headers=headers)
        assert list_res.status_code == 200
        assert any(p["id"] == po_id for p in list_res.json()["data"])

        confirm_res = client.patch(f"/api/v1/purchase-orders/{po_id}/confirm", headers=headers)
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "confirmed"

        reconfirm_res = client.patch(f"/api/v1/purchase-orders/{po_id}/confirm", headers=headers)
        assert reconfirm_res.status_code in (400, 422)


def test_purchase_order_validation_errors():
    with TestClient(app) as client:
        headers = auth_headers(client)

        bad_vendor_payload = {
            "vendor_id": 999999,
            "lines": [{"product_id": 1, "quantity": 2, "unit_price": 500.00}],
        }
        res_vendor = client.post("/api/v1/purchase-orders", headers=headers, json=bad_vendor_payload)
        assert res_vendor.status_code == 404

        res_404 = client.get("/api/v1/purchase-orders/999999", headers=headers)
        assert res_404.status_code == 404


def test_purchase_orders_require_auth():
    with TestClient(app) as client:
        assert client.get("/api/v1/purchase-orders").status_code == 401
        assert client.post("/api/v1/purchase-orders", json={"vendor_id": 1, "lines": []}).status_code == 401
        assert client.get("/api/v1/purchase-orders/1").status_code == 401
        assert client.patch("/api/v1/purchase-orders/1/confirm").status_code == 401


def test_confirm_sets_confirmed_at():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)
        po = create_draft_po(client, headers, vendor_id, product_id)

        assert po.get("confirmed_at") is None

        confirm_res = client.patch(f"/api/v1/purchase-orders/{po['id']}/confirm", headers=headers)
        assert confirm_res.status_code == 200
        confirmed_at = confirm_res.json().get("confirmed_at")
        assert confirmed_at is not None

        get_res = client.get(f"/api/v1/purchase-orders/{po['id']}", headers=headers)
        assert get_res.json()["confirmed_at"] == confirmed_at


def test_cancel_purchase_order():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)

        # Draft -> cancelled works
        po = create_draft_po(client, headers, vendor_id, product_id)
        cancel_res = client.patch(f"/api/v1/purchase-orders/{po['id']}/cancel", headers=headers)
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"

        # Cancelling a cancelled PO fails
        recancel = client.patch(f"/api/v1/purchase-orders/{po['id']}/cancel", headers=headers)
        assert recancel.status_code == 422

        # Cancelling a confirmed PO fails
        po2 = create_draft_po(client, headers, vendor_id, product_id)
        client.patch(f"/api/v1/purchase-orders/{po2['id']}/confirm", headers=headers)
        cancel_confirmed = client.patch(f"/api/v1/purchase-orders/{po2['id']}/cancel", headers=headers)
        assert cancel_confirmed.status_code == 422


def test_update_purchase_order_draft_only():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)
        product2_id = create_product(client, headers)

        po = create_draft_po(client, headers, vendor_id, product_id, quantity=10, unit_price=1000.00)

        # Edit replaces lines and recomputes total
        update_payload = {
            "vendor_id": vendor_id,
            "lines": [
                {"product_id": product2_id, "quantity": 3, "unit_price": 500.00},
                {"product_id": product_id, "quantity": 1, "unit_price": 250.00},
            ],
        }
        put_res = client.put(f"/api/v1/purchase-orders/{po['id']}", headers=headers, json=update_payload)
        assert put_res.status_code == 200, put_res.text
        updated = put_res.json()
        assert updated["total"] == 1750.00
        assert len(updated["lines"]) == 2
        assert updated["lines"][0]["product_id"] == product2_id

        # Confirmed POs cannot be edited
        client.patch(f"/api/v1/purchase-orders/{po['id']}/confirm", headers=headers)
        edit_confirmed = client.put(f"/api/v1/purchase-orders/{po['id']}", headers=headers, json=update_payload)
        assert edit_confirmed.status_code == 422


def test_analytic_accounts_budget_tracking():
    from app.models.analytic_account import AnalyticAccount

    with TestClient(app) as client:
        headers = auth_headers(client)

        # Create an analytic account directly in the DB (no POST endpoint by design)
        db = SessionLocal()
        try:
            analytic = AnalyticAccount(name=f"Test Project {uuid.uuid4().hex[:6]}", budget_amount=10000.0)
            db.add(analytic)
            db.commit()
            db.refresh(analytic)
            analytic_id = analytic.id
        finally:
            db.close()

        # Nothing committed yet
        res = client.get("/api/v1/analytic-accounts", headers=headers)
        assert res.status_code == 200
        entry = next(a for a in res.json()["data"] if a["id"] == analytic_id)
        assert entry["budget_amount"] == 10000.0
        assert entry["committed_amount"] == 0.0
        assert entry["remaining_amount"] == 10000.0

        # Confirm a PO against the analytic -> committed moves
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)
        po = create_draft_po(client, headers, vendor_id, product_id, quantity=2, unit_price=1000.00, analytic_account_id=analytic_id)
        client.patch(f"/api/v1/purchase-orders/{po['id']}/confirm", headers=headers)

        res2 = client.get("/api/v1/analytic-accounts", headers=headers)
        entry2 = next(a for a in res2.json()["data"] if a["id"] == analytic_id)
        assert entry2["committed_amount"] == 2000.0
        assert entry2["remaining_amount"] == 8000.0
