"""
Business logic service for user authentication and registration with Login ID support.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, AdminUserCreateRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictException, UnauthorizedException, ValidationException, ForbiddenException


ROLE_MAP = {
    "admin": "admin",
    "administrator": "admin",
    "accountant": "invoicing_user",
    "invoicing_user": "invoicing_user",
    "user": "contact",
    "contact": "contact",
}


def register_user(db: Session, req: RegisterRequest) -> AuthResponse:
    """
    Public registration endpoint.
    Per spec: Public signup ALWAYS assigns role 'invoicing_user' (Accountant)
    to prevent privilege escalation.
    Safeguard: Explicitly forbids registering with admin role.
    """
    # 0. Safeguard against admin registration attempts
    if req.role:
        normalized_role = req.role.strip().lower()
        if normalized_role in ("admin", "administrator"):
            raise ForbiddenException(message="Registration with admin role is forbidden", code="ROLE_NOT_ALLOWED")

    # 1. Check if Login ID is already taken
    existing_login = db.query(User).filter(User.login_id == req.login_id).first()
    if existing_login:
        raise ConflictException(code="LOGIN_ID_ALREADY_EXISTS", message=f"User with Login ID '{req.login_id}' already exists")

    # 2. Check if Email is already taken
    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise ConflictException(code="EMAIL_ALREADY_EXISTS", message=f"User with email '{req.email}' already exists")

    # 3. Create user record - strictly as user (contact role)
    name = req.name if req.name and req.name.strip() else req.login_id
    hashed_pw = hash_password(req.password)
    user = User(
        login_id=req.login_id,
        email=req.email,
        password_hash=hashed_pw,
        name=name,
        role="contact",
        contact_id=None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 4. Generate JWT token
    token_data = {
        "sub": user.login_id or user.email,
        "id": user.id,
        "login_id": user.login_id,
        "email": user.email,
        "role": user.role,
        "name": user.name,
    }
    token = create_access_token(token_data)

    return AuthResponse(
        id=user.id,
        login_id=user.login_id,
        email=user.email,
        name=user.name,
        role=user.role,
        token=token,
    )


def admin_create_user(db: Session, req: AdminUserCreateRequest) -> User:
    """
    Admin-only user creation endpoint (POST /api/v1/users).
    Supports assigning roles: admin, invoicing_user, or contact, and linking contact_id.
    """
    raw_role = req.role.lower().strip() if req.role else "invoicing_user"
    normalized_role = ROLE_MAP.get(raw_role)
    if not normalized_role:
        raise ValidationException(f"Invalid role '{req.role}'. Allowed roles: admin, invoicing_user, contact")

    # 1. Check if Login ID is already taken
    existing_login = db.query(User).filter(User.login_id == req.login_id).first()
    if existing_login:
        raise ConflictException(code="LOGIN_ID_ALREADY_EXISTS", message=f"User with Login ID '{req.login_id}' already exists")

    # 2. Check if Email is already taken
    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise ConflictException(code="EMAIL_ALREADY_EXISTS", message=f"User with email '{req.email}' already exists")

    # 3. Create user record
    name = req.name if req.name and req.name.strip() else req.login_id
    hashed_pw = hash_password(req.password)
    user = User(
        login_id=req.login_id,
        email=req.email,
        password_hash=hashed_pw,
        name=name,
        role=normalized_role,
        contact_id=req.contact_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def login_user(db: Session, req: LoginRequest) -> AuthResponse:
    """Authenticate user credentials by Login ID (or email) and return user profile + JWT token."""
    login_input = req.login_id.strip()
    user = db.query(User).filter(
        or_(User.login_id == login_input, User.email == login_input)
    ).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise UnauthorizedException(message="Invalid Login Id or Password", code="INVALID_CREDENTIALS")

    if not user.is_active:
        raise UnauthorizedException(message="User account is inactive", code="USER_INACTIVE")

    token_data = {
        "sub": user.login_id or user.email,
        "id": user.id,
        "login_id": user.login_id,
        "email": user.email,
        "role": user.role,
        "name": user.name,
    }
    token = create_access_token(token_data)

    return AuthResponse(
        id=user.id,
        login_id=user.login_id,
        email=user.email,
        name=user.name,
        role=user.role,
        token=token,
    )
