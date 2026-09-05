"""
Unit & Integration tests for Authentication, Role Restrictions, and Admin User Creation.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base, SessionLocal
from app.models.user import User
from app.core.security import hash_password, create_access_token
from app.core.database import engine, Base, SessionLocal
from app.models.user import User


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist before running tests."""
    Base.metadata.create_all(bind=engine)
    yield


def test_public_registration_creates_accountant_role_only():
    """Public registration should not accept admin roles and strictly assign invoicing_user (accountant) role."""
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:4]
        test_login_id = f"user_{unique_suffix}"
        test_email = f"user_{unique_suffix}@urbanfurniture.com"
        test_password = "SecureP@ssword123!"
        test_name = "Regular Portal User"

        # 1. Public signup without role specified -> defaults to invoicing_user (Accountant)
        # 1. Register new user with login_id (public signup creates user/contact role)
        reg_payload = {
            "login_id": test_login_id,
            "email": test_email,
            "password": test_password,
            "name": test_name,
        }
        response = client.post("/api/v1/auth/register", json=reg_payload)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["login_id"] == test_login_id
        assert data["email"] == test_email
        assert data["name"] == test_name
        assert data["role"] == "invoicing_user"
        assert data["role"] == "contact"
        assert "token" in data

        # 2. Attempt to register directly with admin role -> rejected
        admin_attempt_payload = {
            "login_id": f"adm_{unique_suffix}",
            "email": f"adm_{unique_suffix}@urbanfurniture.com",
            "password": test_password,
            "name": "Malicious Admin",
            "role": "admin",
        }
        admin_res = client.post("/api/v1/auth/register", json=admin_attempt_payload)
        assert admin_res.status_code in (403, 422)

        # 3. Attempt with administrator role -> rejected
        admin_attempt_payload2 = {
            "login_id": f"adm2_{unique_suffix}",
            "email": f"adm2_{unique_suffix}@urbanfurniture.com",
            "password": test_password,
            "name": "Malicious Admin 2",
            "role": "administrator",
        }
        admin_res2 = client.post("/api/v1/auth/register", json=admin_attempt_payload2)
        assert admin_res2.status_code in (403, 422)


def test_create_user_endpoint_strictly_restricted_to_admin():
    """
    POST /api/v1/users must only be accessible to users with the 'admin' role.
    - Anonymous: 401 Unauthorized
    - Portal user ('contact'): 403 Forbidden
    - Accountant ('invoicing_user'): 403 Forbidden
    - Admin ('admin'): 201 Created
    """
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:4]

        # 1. Anonymous attempt -> 401
        new_user_payload = {
            "login_id": f"new_{unique_suffix}",
            "email": f"new_{unique_suffix}@urbanfurniture.com",
            "password": "SecureP@ssword123!",
            "name": "New Employee",
            "role": "invoicing_user",
        }
        anon_res = client.post("/api/v1/users", json=new_user_payload)
        assert anon_res.status_code == 401

        # 2. Register a standard portal user (contact)
        contact_login = f"cnt_{unique_suffix}"
        reg_contact = client.post(
            "/api/v1/auth/register",
            json={
                "login_id": contact_login,
                "email": f"{contact_login}@urbanfurniture.com",
                "password": "SecureP@ssword123!",
                "name": "Contact User",
            },
        )
        assert reg_contact.status_code == 201
        contact_token = reg_contact.json()["token"]

        # Portal user calling POST /api/v1/users -> 403 Forbidden
        contact_res = client.post(
            "/api/v1/users",
            json=new_user_payload,
            headers={"Authorization": f"Bearer {contact_token}"},
        )
        assert contact_res.status_code == 403
        assert "not authorized" in contact_res.json()["error"]["message"].lower()

        # 3. Create DB records for Accountant and Admin
        acc_login = f"acc_{unique_suffix}"
        adm_login = f"adm_{unique_suffix}"
        with SessionLocal() as db:
            acc_user = User(
                login_id=acc_login,
                email=f"{acc_login}@urbanfurniture.com",
                password_hash=hash_password("SecureP@ssword123!"),
                name="Test Accountant",
                role="invoicing_user",
                is_active=True,
            )
            adm_user = User(
                login_id=adm_login,
                email=f"{adm_login}@urbanfurniture.com",
                password_hash=hash_password("SecureP@ssword123!"),
                name="System Admin",
                role="admin",
                is_active=True,
            )
            db.add(acc_user)
            db.add(adm_user)
            db.commit()
            db.refresh(acc_user)
            db.refresh(adm_user)

            acc_id = acc_user.id
            adm_id = adm_user.id

        accountant_token = create_access_token({
            "sub": acc_login,
            "id": acc_id,
            "login_id": acc_login,
            "email": f"{acc_login}@urbanfurniture.com",
            "role": "invoicing_user",
            "name": "Test Accountant",
        })

        admin_token = create_access_token({
            "sub": adm_login,
            "id": adm_id,
            "login_id": adm_login,
            "email": f"{adm_login}@urbanfurniture.com",
            "role": "admin",
            "name": "System Admin",
        })

        # Accountant calling POST /api/v1/users -> 403 Forbidden
        acc_res = client.post(
            "/api/v1/users",
            json=new_user_payload,
            headers={"Authorization": f"Bearer {accountant_token}"},
        )
        assert acc_res.status_code == 403
        assert "not authorized" in acc_res.json()["error"]["message"].lower()

        # Admin calling POST /api/v1/users to create an Accountant -> 201 Created
        admin_create_acc_payload = {
            "login_id": f"acct_{unique_suffix}",
            "email": f"acct_{unique_suffix}@urbanfurniture.com",
            "password": "SecureP@ssword123!",
            "name": "Created Accountant",
            "role": "invoicing_user",
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
        assert login_data["role"] == "contact"
        assert "token" in login_data

        # 5. Login with wrong password -> Expect 401 with "Invalid Login Id or Password"
        bad_login_payload = {
            "login_id": test_login_id,
            "password": "WrongP@ssword123"
        }
        admin_acc_res = client.post(
            "/api/v1/users",
            json=admin_create_acc_payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert admin_acc_res.status_code == 201, admin_acc_res.text
        created_acc = admin_acc_res.json()
        assert created_acc["login_id"] == admin_create_acc_payload["login_id"]
        assert created_acc["role"] == "invoicing_user"

        # Admin calling POST /api/v1/users to create another Admin -> 201 Created
        admin_create_adm_payload = {
            "login_id": f"admn_{unique_suffix}",
            "email": f"admn_{unique_suffix}@urbanfurniture.com",
            "password": "SecureP@ssword123!",
            "name": "Created Administrator",
            "role": "admin",
        }
        admin_adm_res = client.post(
            "/api/v1/users",
            json=admin_create_adm_payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert admin_adm_res.status_code == 201, admin_adm_res.text
        created_adm = admin_adm_res.json()
        assert created_adm["login_id"] == admin_create_adm_payload["login_id"]
        assert created_adm["role"] == "admin"

        # Admin calling GET /api/v1/users -> 200 OK
        list_res = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert list_res.status_code == 200
        assert isinstance(list_res.json(), list)

        # Non-admin calling GET /api/v1/users -> 403 Forbidden
        list_res_contact = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {contact_token}"},
        )
        assert list_res_contact.status_code == 403


def test_auth_login_and_validations():
    """Verify login authentication and input validations."""
        # 6. Fetch /me profile with valid token -> Expect 200
        headers = {"Authorization": f"Bearer {token}"}
        me_response = client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200, me_response.text
        me_data = me_response.json()
        assert me_data["login_id"] == test_login_id
        assert me_data["email"] == test_email
        assert me_data["role"] == "contact"


def test_auth_validations():
    with TestClient(app) as client:
        unique_suffix = uuid.uuid4().hex[:4]
        test_login_id = f"user_{unique_suffix}"
        test_email = f"user_{unique_suffix}@urbanfurniture.com"
        test_password = "SecureP@ssword123!"

        # Register
        reg_res = client.post(
            "/api/v1/auth/register",
            json={
                "login_id": test_login_id,
                "email": test_email,
                "password": test_password,
                "name": "Valid User",
            },
        )
        assert reg_res.status_code == 201
        token = reg_res.json()["token"]

        # Login with login_id
        login_res = client.post(
            "/api/v1/auth/login",
            json={"login_id": test_login_id, "password": test_password},
        )
        assert login_res.status_code == 200
        assert login_res.json()["login_id"] == test_login_id

        # Login with wrong password -> 401
        bad_login_res = client.post(
            "/api/v1/auth/login",
            json={"login_id": test_login_id, "password": "WrongPassword123!"},
        )
        assert bad_login_res.status_code == 401
        assert bad_login_res.json()["error"]["code"] == "INVALID_CREDENTIALS"

        # Check /me endpoint
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["role"] == "invoicing_user"

        # Invalid Login ID (< 6 chars)
        short_res = client.post(
            "/api/v1/auth/register",
            json={
                "login_id": "usr",
                "email": "short@test.com",
                "password": "ValidP@ssword123!",
                "name": "Short User",
            },
        )
        assert short_res.status_code in (400, 422)

        # Weak Password (missing uppercase & special char)
        weak_res = client.post(
            "/api/v1/auth/register",
            json={
                "login_id": "validusr123",
                "email": "weak@test.com",
                "password": "password123",
                "name": "Weak Pass User",
            },
        )
        assert weak_res.status_code in (400, 422)


def test_role_gates_and_admin_user_creation():
    """Verify role-based access control and Admin user management."""
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.core.security import hash_password

    with TestClient(app) as client:
        unique = uuid.uuid4().hex[:4]
        admin_login_id = f"admin_{unique}"
        admin_email = f"admin_{unique}@urbanfurniture.com"
        admin_pw = "AdminSecureP@ss1"

        # 1. Seed an admin user directly into the database
        db = SessionLocal()
        try:
            admin_user = User(
                login_id=admin_login_id,
                email=admin_email,
                password_hash=hash_password(admin_pw),
                name="System Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
        finally:
            db.close()

        # 2. Login as Admin
        admin_login_res = client.post("/api/v1/auth/login", json={
            "login_id": admin_login_id,
            "password": admin_pw,
        })
        assert admin_login_res.status_code == 200
        admin_token = admin_login_res.json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 3. Admin creates an Accountant (invoicing_user)
        acct_login_id = f"acct_{unique}"
        acct_res = client.post("/api/v1/users", headers=admin_headers, json={
            "login_id": acct_login_id,
            "email": f"acct_{unique}@urbanfurniture.com",
            "password": "SecureP@ssword123!",
            "name": "Head Accountant",
            "role": "invoicing_user",
        })
        assert acct_res.status_code == 201, acct_res.text
        assert acct_res.json()["role"] == "invoicing_user"

        # 4. Admin creates a Portal Contact User
        portal_login_id = f"port_{unique}"
        portal_res = client.post("/api/v1/users", headers=admin_headers, json={
            "login_id": portal_login_id,
            "email": f"portal_{unique}@urbanfurniture.com",
            "password": "SecureP@ssword123!",
            "name": "Nimesh Pathak",
            "role": "contact",
            "contact_id": 5,
        })
        assert portal_res.status_code == 201, portal_res.text
        assert portal_res.json()["role"] == "contact"
        assert portal_res.json()["contact_id"] == 5

        # 5. Non-Admin (Accountant) login & attempt to call Admin route
        acct_login_res = client.post("/api/v1/auth/login", json={
            "login_id": acct_login_id,
            "password": "SecureP@ssword123!",
        })
        assert acct_login_res.status_code == 200
        acct_token = acct_login_res.json()["token"]
        acct_headers = {"Authorization": f"Bearer {acct_token}"}

        # Accountant denied Admin-only route
        acct_forbidden_res = client.post("/api/v1/users", headers=acct_headers, json={
            "login_id": f"fail_{unique}",
            "email": f"fail_{unique}@test.com",
            "password": "SecureP@ssword123!",
            "name": "Fail User",
            "role": "admin",
        })
        assert acct_forbidden_res.status_code == 403, acct_forbidden_res.text

        # 6. Portal Contact User denied Admin-only route
        portal_login_res = client.post("/api/v1/auth/login", json={
            "login_id": portal_login_id,
            "password": "SecureP@ssword123!",
        })
        assert portal_login_res.status_code == 200
        portal_token = portal_login_res.json()["token"]
        portal_headers = {"Authorization": f"Bearer {portal_token}"}

        portal_forbidden_res = client.post("/api/v1/users", headers=portal_headers, json={
            "login_id": f"fail2_{unique}",
            "email": f"fail2_{unique}@test.com",
            "password": "SecureP@ssword123!",
            "name": "Fail User 2",
            "role": "admin",
        })
        assert portal_forbidden_res.status_code == 403, portal_forbidden_res.text

        # 7. Unauthenticated request to Admin-only route denied
        unauth_res = client.post("/api/v1/users", json={
            "login_id": f"fail3_{unique}",
            "email": f"fail3_{unique}@test.com",
            "password": "SecureP@ssword123!",
            "name": "Fail User 3",
            "role": "admin",
        })
        assert unauth_res.status_code == 401

        # 8. Inactive user is rejected on login
        db = SessionLocal()
        try:
            user_to_deactivate = db.query(User).filter(User.login_id == portal_login_id).first()
            user_to_deactivate.is_active = False
            db.commit()
        finally:
            db.close()

        inactive_res = client.post("/api/v1/auth/login", json={
            "login_id": portal_login_id,
            "password": "SecureP@ssword123!",
        })
        assert inactive_res.status_code == 401
        assert inactive_res.json()["error"]["code"] == "USER_INACTIVE"


def test_auth_register_rejects_admin_role_in_payload():
    """Verify that public signup rejects any attempt to pass admin roles in the payload."""
    with TestClient(app) as client:
        unique = uuid.uuid4().hex[:4]

        # 1. Reject 'admin' in role payload
        admin_payload = {
            "login_id": f"admin_{unique}",
            "email": f"admin_{unique}@test.com",
            "password": "SecureP@ssword123!",
            "name": "Attacker Admin",
            "role": "admin",
        }
        res_admin = client.post("/api/v1/auth/register", json=admin_payload)
        assert res_admin.status_code in (403, 422), res_admin.text
        err_json = res_admin.json()
        assert "Registration with admin role is forbidden" in str(err_json)

        # 2. Reject 'administrator' in role payload
        admin_alias_payload = {
            "login_id": f"adm2_{unique}",
            "email": f"adm2_{unique}@test.com",
            "password": "SecureP@ssword123!",
            "name": "Attacker Administrator",
            "role": "administrator",
        }
        res_alias = client.post("/api/v1/auth/register", json=admin_alias_payload)
        assert res_alias.status_code in (403, 422), res_alias.text
        assert "Registration with admin role is forbidden" in str(res_alias.json())

        # 3. Reject case variations like 'ADMIN'
        admin_upper_payload = {
            "login_id": f"adm3_{unique}",
            "email": f"adm3_{unique}@test.com",
            "password": "SecureP@ssword123!",
            "name": "Attacker Upper",
            "role": "ADMIN",
        }
        res_upper = client.post("/api/v1/auth/register", json=admin_upper_payload)
        assert res_upper.status_code in (403, 422), res_upper.text
        assert "Registration with admin role is forbidden" in str(res_upper.json())

        # 4. Verify no user was created in the database for rejected attempts
        db = SessionLocal()
        try:
            assert db.query(User).filter(User.login_id == f"admin_{unique}").first() is None
            assert db.query(User).filter(User.login_id == f"adm2_{unique}").first() is None
            assert db.query(User).filter(User.login_id == f"adm3_{unique}").first() is None
        finally:
            db.close()

        # 5. Verify legitimate signup with omitted role succeeds as invoicing_user
        valid_payload = {
            "login_id": f"legit_{unique}",
            "email": f"legit_{unique}@test.com",
            "password": "SecureP@ssword123!",
            "name": "Legit User",
        }
        valid_res = client.post("/api/v1/auth/register", json=valid_payload)
        assert valid_res.status_code == 201, valid_res.text
        assert valid_res.json()["role"] == "contact"


def test_auth_service_register_user_raises_forbidden_for_admin_role():
    """Verify defense-in-depth in auth_service raises ForbiddenException if admin role reaches it."""
    from app.services import auth_service
    from app.core.exceptions import ForbiddenException
    from unittest.mock import MagicMock

    mock_req = MagicMock()
    mock_req.role = "admin"
    mock_db = MagicMock()

    with pytest.raises(ForbiddenException) as exc_info:
        auth_service.register_user(mock_db, mock_req)
    assert exc_info.value.code == "ROLE_NOT_ALLOWED"
    assert exc_info.value.status_code == 403

