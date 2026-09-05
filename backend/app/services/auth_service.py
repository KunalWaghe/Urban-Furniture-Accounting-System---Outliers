"""
Business logic service for user authentication and registration with Login ID support.
"""

from datetime import datetime, timedelta, timezone
import threading
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, AdminUserCreateRequest, ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse
from app.core.security import hash_password, verify_password, create_access_token, generate_reset_token
from app.core.exceptions import ConflictException, UnauthorizedException, ValidationException, ForbiddenException
from app.models.contact import Contact
from app.services import contact_service, email_service


ROLE_MAP = {
    "admin": "admin",
    "administrator": "admin",
    "accountant": "invoicing_user",
    "invoicing_user": "invoicing_user",
    "user": "contact",
    "contact": "contact",
}

RESERVED_LOGIN_IDS = frozenset({"admin", "admin001", "administrator", "accountant"})

DEMO_USERS = (
    {
        "login_id": "admin",
        "email": "admin@urbanfurniture.com",
        "name": "System Administrator",
        "role": "admin",
        "password": "Admin@123",
    },
    {
        "login_id": "admin001",
        "email": "admin001@urbanfurniture.com",
        "name": "System Administrator",
        "role": "admin",
        "password": "Admin@123",
    },
    {
        "login_id": "accountant",
        "email": "accountant@urbanfurniture.com",
        "name": "Senior Accountant",
        "role": "invoicing_user",
        "password": "Accountant@123",
    },
)


def ensure_demo_users(db: Session) -> None:
    """
    Guarantee canonical demo login accounts exist with expected roles and passwords.

    Upserts by login_id first, then email, so `admin` / `Admin@123` keeps working
    even if prior tests or manual edits changed login_id or password_hash.
    """
    for demo in DEMO_USERS:
        login_id = demo["login_id"]
        email = demo["email"]

        user = db.query(User).filter(User.login_id == login_id).first()
        if not user:
            user = db.query(User).filter(User.email == email).first()

        conflict = (
            db.query(User)
            .filter(User.login_id == login_id, User.id != (user.id if user else -1))
            .first()
        )
        if conflict:
            conflict.login_id = f"{conflict.login_id}_legacy_{conflict.id}"

        if not user:
            user = User(
                login_id=login_id,
                email=email,
                name=demo["name"],
                role=demo["role"],
                password_hash=hash_password(demo["password"]),
                is_active=True,
            )
            db.add(user)
            print(f"  [SEEDED USER] login_id={login_id} role={demo['role']} password={demo['password']}")
            continue

        user.login_id = login_id
        user.email = email
        user.name = demo["name"]
        user.role = demo["role"]
        user.password_hash = hash_password(demo["password"])
        user.is_active = True
        print(f"  [SEEDED USER] login_id={login_id} role={demo['role']} password={demo['password']}")

    db.commit()


def register_user(db: Session, req: RegisterRequest) -> AuthResponse:
    """Register a new user with unique Login ID and Email (Public signup creates contact/portal role)."""
    # Public registration is always contact — reject privilege escalation attempts
    if req.role:
        check_role = req.role.strip().lower()
        mapped_role = ROLE_MAP.get(check_role, check_role)
        if mapped_role in ("admin", "invoicing_user"):
            raise ForbiddenException(
                message=f"Registration with {mapped_role} role is forbidden",
                code="ROLE_NOT_ALLOWED",
            )

    assigned_role = "contact"

    normalized_login_id = req.login_id.strip().lower()
    if normalized_login_id in RESERVED_LOGIN_IDS:
        raise ConflictException(
            code="LOGIN_ID_RESERVED",
            message=f"Login ID '{req.login_id}' is reserved and cannot be used for public signup",
        )

    # 1. Check if Login ID is already taken
    existing_login = db.query(User).filter(User.login_id == req.login_id).first()
    if existing_login:
        raise ConflictException(code="LOGIN_ID_ALREADY_EXISTS", message=f"User with Login ID '{req.login_id}' already exists")

    # 2. Check if Email is already taken
    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise ConflictException(code="EMAIL_ALREADY_EXISTS", message=f"User with email '{req.email}' already exists")

    # 3. Ensure portal users have a linked customer contact for self-service invoices
    name = req.name if req.name and req.name.strip() else req.login_id
    contact_id = req.contact_id
    if assigned_role == "contact":
        contact = contact_service.ensure_contact_for_portal_user(
            db,
            name=name,
            email=req.email,
            contact_id=contact_id,
        )
        contact_id = contact.id

    # 4. Create user record
    hashed_pw = hash_password(req.password)
    user = User(
        login_id=req.login_id,
        email=req.email,
        password_hash=hashed_pw,
        name=name,
        role=assigned_role,
        contact_id=contact_id,
        is_active=True,
    )
    db.add(user)
    try:
        # 'commit' persists the registered user record
        db.commit()
    except Exception:
        db.rollback()
        raise
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
    Create a new user account internally.
    Only authorized Admin users may invoke this.
    Supports assigning Admin ('admin') or Accountant ('invoicing_user') roles.
    """
    raw_role = req.role.strip().lower() if req.role else "invoicing_user"
    normalized_role = ROLE_MAP.get(raw_role)
    if not normalized_role or normalized_role not in ("admin", "invoicing_user", "contact"):
        raise ValidationException(
            f"Invalid role '{req.role}'. Allowed internal roles: admin, invoicing_user, contact"
        )

    # 1. Check if Login ID is already taken
    existing_login = db.query(User).filter(User.login_id == req.login_id).first()
    if existing_login:
        raise ConflictException(
            code="LOGIN_ID_ALREADY_EXISTS",
            message=f"User with Login ID '{req.login_id}' already exists",
        )

    # 2. Check if Email is already taken
    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise ConflictException(
            code="EMAIL_ALREADY_EXISTS",
            message=f"User with email '{req.email}' already exists",
        )

    # 3. Validate contact_id if provided
    if req.contact_id is not None:
        contact = db.query(Contact).filter(Contact.id == req.contact_id).first()
        if not contact:
            raise ValidationException(f"Contact with id {req.contact_id} does not exist")

    # 4. Create user record
    name = req.name.strip() if req.name and req.name.strip() else req.login_id
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
    try:
        # 'commit' persists the admin-provisioned user account
        db.commit()
    except Exception:
        db.rollback()
        raise
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


def forgot_password(db: Session, req: ForgotPasswordRequest) -> ForgotPasswordResponse:
    """
    Initiate password reset process by generating a reset token.
    
    Always returns success message to prevent email enumeration attacks.
    Token is valid for 1 hour.
    
    NOTE: In production, this should send an email with the reset link.
    For hackathon/demo purposes, the token is returned in the response.
    """
    user = db.query(User).filter(User.email == req.email).first()
    
    if user and user.is_active:
        # Generate reset token
        reset_token = generate_reset_token()
        reset_token_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Store token in database
        user.reset_token = reset_token
        user.reset_token_expiry = reset_token_expiry
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise
        
        # Dispatch password reset email asynchronously
        recipient_email = user.email
        recipient_name = user.name
        threading.Thread(
            target=email_service.send_password_reset_email,
            args=(recipient_email, reset_token, recipient_name),
            daemon=True,
        ).start()
    
    # Always return success to prevent email enumeration
    return ForgotPasswordResponse(
        message="If the email exists in our system, a password reset link has been sent.",
        email=req.email
    )


def reset_password(db: Session, req: ResetPasswordRequest) -> ResetPasswordResponse:
    """
    Reset user password using a valid reset token.
    
    Validates token and expiry, then updates password.
    """
    user = db.query(User).filter(User.reset_token == req.token).first()
    
    if not user:
        raise ValidationException("Invalid or expired reset token")
    
    expiry = user.reset_token_expiry
    if expiry is not None and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if not expiry or expiry < datetime.now(timezone.utc):
        # Clear expired token
        user.reset_token = None
        user.reset_token_expiry = None
        db.commit()
        raise ValidationException("Invalid or expired reset token")
    
    # Update password
    user.password_hash = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    
    return ResetPasswordResponse(
        message="Password has been successfully reset. You can now login with your new password."
    )
