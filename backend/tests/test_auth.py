"""
Unit & Integration tests for Authentication endpoints (P0-BE-02).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base
from app.models.user import User


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist before running tests."""
    Base.metadata.create_all(bind=engine)
    yield


import uuid

def test_auth_register_and_login_flow():
    with TestClient(app) as client:
        test_email = "riya@urbanfurniture.com"
        test_password = "password"
        test_name = "Riya Test"

        # 1. Register new user
        reg_payload = {
            "email": test_email,
            "password": test_password,
            "name": test_name,
            "role": "admin"
        }
        response = client.post("/api/v1/auth/register", json=reg_payload)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["email"] == test_email
        assert data["name"] == test_name
        assert data["role"] == "admin"
        assert "token" in data
        assert len(data["token"]) > 20

        token = data["token"]

        # 2. Register duplicate email -> Expect 409
        dup_response = client.post("/api/v1/auth/register", json=reg_payload)
        assert dup_response.status_code == 409
        dup_data = dup_response.json()
        assert dup_data["error"]["code"] == "EMAIL_ALREADY_EXISTS"

        # 3. Login with correct credentials -> Expect 200
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_response = client.post("/api/v1/auth/login", json=login_payload)
        assert login_response.status_code == 200, login_response.text
        login_data = login_response.json()
        assert login_data["email"] == test_email
        assert "token" in login_data

        # 4. Login with wrong password -> Expect 401
        bad_login_payload = {
            "email": test_email,
            "password": "WrongPassword123"
        }
        bad_response = client.post("/api/v1/auth/login", json=bad_login_payload)
        assert bad_response.status_code == 401
        bad_data = bad_response.json()
        assert bad_data["error"]["code"] == "INVALID_CREDENTIALS"

        # 5. Fetch /me profile with valid token -> Expect 200
        headers = {"Authorization": f"Bearer {token}"}
        me_response = client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200, me_response.text
        me_data = me_response.json()
        assert me_data["email"] == test_email
        assert me_data["name"] == test_name
        assert me_data["role"] == "admin"

        # 6. Fetch /me profile without token -> Expect 401
        no_auth_response = client.get("/api/v1/auth/me")
        assert no_auth_response.status_code == 401
