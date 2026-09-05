"""
Unit & Integration tests for Contact endpoints (P0-BE-03).
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


def test_contact_crud_flow():
    with TestClient(app) as client:
        # 1. Create a customer contact
        payload = {
            "name": "Acme Corp",
            "type": "customer",
            "email": "contact@acme.com",
            "mobile": "+91 9876543210",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        }
        res = client.post("/api/v1/contacts", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["name"] == "Acme Corp"
        assert data["type"] == "customer"
        assert data["email"] == "contact@acme.com"
        assert data["is_active"] is True
        contact_id = data["id"]

        # 2. Create a vendor contact
        vendor_payload = {
            "name": "Timber Supplies Ltd",
            "type": "vendor",
            "email": "sales@timbersupplies.com",
            "city": "Bangalore"
        }
        v_res = client.post("/api/v1/contacts", json=vendor_payload)
        assert v_res.status_code == 201
        vendor_id = v_res.json()["id"]

        # 3. Get single contact by ID
        get_res = client.get(f"/api/v1/contacts/{contact_id}")
        assert get_res.status_code == 200
        assert get_res.json()["city"] == "Mumbai"

        # 4. List contacts with filtering
        list_res = client.get("/api/v1/contacts?type=customer")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert any(c["id"] == contact_id for c in list_data["data"])

        # 5. Update contact
        update_payload = {"city": "Navi Mumbai", "mobile": "+91 9999999999"}
        up_res = client.put(f"/api/v1/contacts/{contact_id}", json=update_payload)
        assert up_res.status_code == 200
        assert up_res.json()["city"] == "Navi Mumbai"
        assert up_res.json()["mobile"] == "+91 9999999999"

        # 6. Soft delete contact
        del_res = client.delete(f"/api/v1/contacts/{contact_id}")
        assert del_res.status_code == 204

        # Verify soft deletion
        get_del_res = client.get(f"/api/v1/contacts/{contact_id}")
        assert get_del_res.status_code == 200
        assert get_del_res.json()["is_active"] is False


def test_contact_validation_errors():
    with TestClient(app) as client:
        # Invalid type
        bad_payload = {"name": "Bad Contact", "type": "invalid_type"}
        res = client.post("/api/v1/contacts", json=bad_payload)
        assert res.status_code in (400, 422)

        # Non-existent contact ID
        res_404 = client.get("/api/v1/contacts/999999")
        assert res_404.status_code == 404
