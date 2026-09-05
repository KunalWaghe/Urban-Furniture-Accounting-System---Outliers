"""
Unit & Integration tests for Pagination, Sorting, and Filtering endpoints.
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


def test_contact_pagination_and_sorting():
    with TestClient(app) as client:
        # Create multiple contacts
        for i in range(5):
            client.post(
                "/api/v1/contacts",
                json={"name": f"Contact {chr(65 + i)}", "type": "customer" if i % 2 == 0 else "vendor", "city": "Mumbai"},
            )

        # 1. Test pagination (page=1, limit=2)
        res = client.get("/api/v1/contacts?page=1&limit=2&sort_by=name&sort_order=asc")
        assert res.status_code == 200, res.text
        data = res.json()
        assert "page" in data and data["page"] == 1
        assert "limit" in data and data["limit"] == 2
        assert "pages" in data
        assert len(data["data"]) <= 2

        # 2. Test sorting desc
        res_desc = client.get("/api/v1/contacts?sort_by=name&sort_order=desc")
        assert res_desc.status_code == 200
        names = [c["name"] for c in res_desc.json()["data"]]
        assert names == sorted(names, reverse=True)


def test_product_pagination_and_filtering():
    with TestClient(app) as client:
        # Create products
        client.post("/api/v1/products", json={"name": "Alpha Chair", "category": "Seating", "price": 100.0})
        client.post("/api/v1/products", json={"name": "Beta Table", "category": "Tables", "price": 250.0})

        # Filter by category
        res = client.get("/api/v1/products?category=Tables")
        assert res.status_code == 200
        data = res.json()["data"]
        assert len(data) >= 1
        assert all("Tables" in p["category"] for p in data if p["category"])

        # Pagination metadata test
        res_pag = client.get("/api/v1/products?page=1&limit=1")
        assert res_pag.status_code == 200
        assert res_pag.json()["limit"] == 1
        assert len(res_pag.json()["data"]) == 1


def test_purchase_order_pagination_and_search():
    with TestClient(app) as client:
        # Setup vendor & product
        vendor = client.post("/api/v1/contacts", json={"name": "Delta Suppliers", "type": "vendor"}).json()
        prod = client.post("/api/v1/products", json={"name": "Oak Wood", "price": 500.0}).json()

        # Create 2 POs
        po1 = client.post("/api/v1/purchase-orders", json={"vendor_id": vendor["id"], "lines": [{"product_id": prod["id"], "quantity": 1, "unit_price": 500.0}]}).json()
        po2 = client.post("/api/v1/purchase-orders", json={"vendor_id": vendor["id"], "lines": [{"product_id": prod["id"], "quantity": 2, "unit_price": 500.0}]}).json()

        # Search PO by po_number
        res_search = client.get(f"/api/v1/purchase-orders?search={po1['po_number']}")
        assert res_search.status_code == 200
        assert any(p["po_number"] == po1["po_number"] for p in res_search.json()["data"])

        # Test pagination metadata
        res_po_pag = client.get("/api/v1/purchase-orders?page=1&limit=10")
        assert res_po_pag.status_code == 200
        data = res_po_pag.json()
        assert "page" in data
        assert "limit" in data
        assert "pages" in data
