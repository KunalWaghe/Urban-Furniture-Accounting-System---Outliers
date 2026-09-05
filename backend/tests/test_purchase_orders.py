"""
Unit & Integration tests for Purchase Order endpoints (P0-BE-05).
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


def test_purchase_order_lifecycle():
    with TestClient(app) as client:
        # 1. Create a Vendor contact
        vendor_res = client.post(
            "/api/v1/contacts",
            json={
                "name": "Azure Furniture Pvt Ltd",
                "type": "vendor",
                "email": "azure@furniture.com",
                "mobile": "9876543210",
                "city": "Mumbai",
            },
        )
        assert vendor_res.status_code == 201, vendor_res.text
        vendor_id = vendor_res.json()["id"]

        # 2. Create a Product
        product_res = client.post(
            "/api/v1/products",
            json={
                "name": "Teak Dining Chair",
                "product_type": "goods",
                "category": "Furniture",
                "price": 1500.00,
                "cost": 1000.00,
                "tax_percent": 18.0,
            },
        )
        assert product_res.status_code == 201, product_res.text
        product_id = product_res.json()["id"]

        # 3. Create a Purchase Order in draft
        po_payload = {
            "vendor_id": vendor_id,
            "lines": [
                {
                    "product_id": product_id,
                    "quantity": 10,
                    "unit_price": 1000.00,
                }
            ],
        }
        create_res = client.post("/api/v1/purchase-orders", json=po_payload)
        assert create_res.status_code == 201, create_res.text
        po_data = create_res.json()

        assert po_data["po_number"].startswith("PO-")
        assert po_data["vendor_id"] == vendor_id
        assert po_data["vendor_name"] == "Azure Furniture Pvt Ltd"
        assert po_data["status"] == "draft"
        assert po_data["total"] == 10000.00
        assert len(po_data["lines"]) == 1

        line = po_data["lines"][0]
        assert line["product_id"] == product_id
        assert line["product_name"] == "Teak Dining Chair"
        assert line["quantity"] == 10
        assert line["unit_price"] == 1000.00
        assert line["subtotal"] == 10000.00

        po_id = po_data["id"]

        # 4. Fetch PO by ID
        get_res = client.get(f"/api/v1/purchase-orders/{po_id}")
        assert get_res.status_code == 200
        assert get_res.json()["po_number"] == po_data["po_number"]

        # 5. List POs
        list_res = client.get("/api/v1/purchase-orders")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert any(p["id"] == po_id for p in list_data["data"])

        # 6. Confirm PO
        confirm_res = client.patch(f"/api/v1/purchase-orders/{po_id}/confirm")
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "confirmed"

        # 7. Re-confirming confirmed PO should fail
        reconfirm_res = client.patch(f"/api/v1/purchase-orders/{po_id}/confirm")
        assert reconfirm_res.status_code in (400, 422)


def test_purchase_order_validation_errors():
    with TestClient(app) as client:
        # Non-existent vendor
        bad_vendor_payload = {
            "vendor_id": 999999,
            "lines": [
                {
                    "product_id": 1,
                    "quantity": 2,
                    "unit_price": 500.00,
                }
            ],
        }
        res_vendor = client.post("/api/v1/purchase-orders", json=bad_vendor_payload)
        assert res_vendor.status_code == 404

        # Non-existent PO detail
        res_404 = client.get("/api/v1/purchase-orders/999999")
        assert res_404.status_code == 404
