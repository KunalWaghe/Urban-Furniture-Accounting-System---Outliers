"""
Unit & Integration tests for Authentication endpoints with Login ID & validation rules.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist before running tests."""
    Base.metadata.create_all(bind=engine)
    yield


def test_auth_register_and_login_with_login_id():
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:4]
        test_login_id = f"user_{unique_suffix}"  # 9 chars (6-12 range)
        test_email = f"user_{unique_suffix}@urbanfurniture.com"
        test_password = "SecureP@ssword123"  # >8 chars, 1 upper, 1 lower, 1 special
        test_name = "User Test"

        # 1. Register new user with login_id
        reg_payload = {
            "login_id": test_login_id,
            "email": test_email,
            "password": test_password,
            "name": test_name,
            "role": "administrator"
        }
        response = client.post("/api/v1/auth/register", json=reg_payload)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["login_id"] == test_login_id
        assert data["email"] == test_email
        assert data["name"] == test_name
        assert data["role"] == "admin"
        assert "token" in data

        token = data["token"]

        # 2. Register duplicate Login ID -> Expect 409 LOGIN_ID_ALREADY_EXISTS
        dup_login_payload = {
            "login_id": test_login_id,
            "email": f"diff_{test_email}",
            "password": test_password,
            "name": "Different Name",
            "role": "accountant"
        }
        dup_res = client.post("/api/v1/auth/register", json=dup_login_payload)
        assert dup_res.status_code == 409
        assert dup_res.json()["error"]["code"] == "LOGIN_ID_ALREADY_EXISTS"

        # 3. Register duplicate Email -> Expect 409 EMAIL_ALREADY_EXISTS
        dup_email_payload = {
            "login_id": f"new_{unique_suffix}",
            "email": test_email,
            "password": test_password,
            "name": "Another Name",
            "role": "user"
        }
        dup_email_res = client.post("/api/v1/auth/register", json=dup_email_payload)
        assert dup_email_res.status_code == 409
        assert dup_email_res.json()["error"]["code"] == "EMAIL_ALREADY_EXISTS"

        # 4. Login using Login ID -> Expect 200
        login_payload = {
            "login_id": test_login_id,
            "password": test_password
        }
        login_response = client.post("/api/v1/auth/login", json=login_payload)
        assert login_response.status_code == 200, login_response.text
        login_data = login_response.json()
        assert login_data["login_id"] == test_login_id
        assert "token" in login_data

        # 5. Login with wrong password -> Expect 401 with "Invalid Login Id or Password"
        bad_login_payload = {
            "login_id": test_login_id,
            "password": "WrongP@ssword123"
        }
        bad_response = client.post("/api/v1/auth/login", json=bad_login_payload)
        assert bad_response.status_code == 401
        bad_data = bad_response.json()
        assert bad_data["error"]["message"] == "Invalid Login Id or Password"
        assert bad_data["error"]["code"] == "INVALID_CREDENTIALS"

        # 6. Fetch /me profile with valid token -> Expect 200
        headers = {"Authorization": f"Bearer {token}"}
        me_response = client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200, me_response.text
        me_data = me_response.json()
        assert me_data["login_id"] == test_login_id
        assert me_data["email"] == test_email
        assert me_data["role"] == "admin"


def test_auth_validations():
    with TestClient(app) as client:
        # Invalid Login ID (< 6 chars)
        short_login = {
            "login_id": "usr",
            "email": "short@test.com",
            "password": "ValidP@ssword123",
            "name": "Short User"
        }
        short_res = client.post("/api/v1/auth/register", json=short_login)
        assert short_res.status_code in (400, 422)

        # Invalid Password (no special character or <= 8 chars)
        weak_pass = {
            "login_id": "validusr123",
            "email": "weak@test.com",
            "password": "password123",  # missing uppercase & special char
            "name": "Weak Pass User"
        }
        weak_res = client.post("/api/v1/auth/register", json=weak_pass)
        assert weak_res.status_code in (400, 422)
