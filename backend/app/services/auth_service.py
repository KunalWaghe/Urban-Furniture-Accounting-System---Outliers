"""
Business logic service for user authentication and registration.
"""

from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictException, UnauthorizedException, ValidationException


ALLOWED_ROLES = {"admin", "invoicing_user", "contact"}


def register_user(db: Session, req: RegisterRequest) -> AuthResponse:
    """Register a new user, store in DB, and return user profile + JWT token."""
    if req.role not in ALLOWED_ROLES:
        raise ValidationException(f"Invalid role '{req.role}'. Must be one of: {', '.join(ALLOWED_ROLES)}")

    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise ConflictException(code="EMAIL_ALREADY_EXISTS", message=f"User with email '{req.email}' already exists")

    hashed_pw = hash_password(req.password)
    user = User(
        email=req.email,
        password_hash=hashed_pw,
        name=req.name,
        role=req.role,
        contact_id=req.contact_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_data = {
        "sub": user.email,
        "id": user.id,
        "role": user.role,
        "name": user.name,
    }
    token = create_access_token(token_data)

    return AuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        token=token,
    )


def login_user(db: Session, req: LoginRequest) -> AuthResponse:
    """Authenticate user credentials and return user profile + JWT token."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedException("User account is inactive")

    token_data = {
        "sub": user.email,
        "id": user.id,
        "role": user.role,
        "name": user.name,
    }
    token = create_access_token(token_data)

    return AuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        token=token,
    )
