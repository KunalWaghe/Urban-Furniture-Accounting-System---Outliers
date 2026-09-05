"""
Unit & Integration tests for Product endpoints (P0-BE-03).
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


def test_product_crud_flow():
    with TestClient(app) as client:
        # 1. Create product
        payload = {
            "name": "Executive Ergonomic Chair",
            "price": 12500.00,
            "tax_percent": 18.0,
            "description": "High-back mesh chair with lumbar support"
        }
        res = client.post("/api/v1/products", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["name"] == "Executive Ergonomic Chair"
        assert data["price"] == 12500.00
        assert data["tax_percent"] == 18.0
        assert data["is_active"] is True
        product_id = data["id"]

        # 2. Get single product by ID
        get_res = client.get(f"/api/v1/products/{product_id}")
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "Executive Ergonomic Chair"

        # 3. List products with search filter
        list_res = client.get("/api/v1/products?search=Ergonomic")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert any(p["id"] == product_id for p in list_data["data"])

        # 4. Update product
        update_payload = {"price": 13999.00, "description": "Updated premium mesh chair"}
        up_res = client.put(f"/api/v1/products/{product_id}", json=update_payload)
        assert up_res.status_code == 200
        assert up_res.json()["price"] == 13999.00
        assert up_res.json()["description"] == "Updated premium mesh chair"

        # 5. Soft delete product
        del_res = client.delete(f"/api/v1/products/{product_id}")
        assert del_res.status_code == 204

        # Verify soft deletion
        get_del_res = client.get(f"/api/v1/products/{product_id}")
        assert get_del_res.status_code == 200
        assert get_del_res.json()["is_active"] is False


def test_product_validation_errors():
    with TestClient(app) as client:
        # Negative price
        bad_payload = {"name": "Invalid Chair", "price": -50.00, "tax_percent": 18.0}
        res = client.post("/api/v1/products", json=bad_payload)
        assert res.status_code in (400, 422)

        # Tax percent > 100
        bad_tax_payload = {"name": "Invalid Tax Item", "price": 500.00, "tax_percent": 150.0}
        res_tax = client.post("/api/v1/products", json=bad_tax_payload)
        assert res_tax.status_code in (400, 422)

        # Non-existent product ID
        res_404 = client.get("/api/v1/products/999999")
        assert res_404.status_code == 404
