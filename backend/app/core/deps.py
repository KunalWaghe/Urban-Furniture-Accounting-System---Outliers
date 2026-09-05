"""
Dependency injection utilities for FastAPI routes.
"""

from typing import Generator, List
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User


security_bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that yields a SQLAlchemy database session per request,
    ensuring it is closed afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that validates the JWT bearer token and retrieves the current User entity.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Missing or invalid authorization header")
    
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise UnauthorizedException("Invalid token payload")
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise UnauthorizedException("User no longer exists")
    if not user.is_active:
        raise ForbiddenException("User account is inactive")
    
    return user


def require_roles(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Usage: Depends(require_roles(["admin", "invoicing_user"]))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(f"Role '{current_user.role}' is not authorized for this operation")
        return current_user

    return role_checker
