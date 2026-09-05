"""
User management API endpoints.

Restricted exclusively to administrator roles ('admin').
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.schemas.auth import AdminUserCreateRequest, UserProfileResponse
from app.services import auth_service
from app.models.user import User

router = APIRouter()


@router.post("", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_user(
    req: AdminUserCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"])),
):
    """
    Create an internal user account.
    
    Security: Only accessible to users with role 'admin'.
    Allows creating accounts for roles: 'admin' and 'invoicing_user' (Accountant).
    """
    return auth_service.admin_create_user(db, req)


@router.get("", response_model=List[UserProfileResponse], status_code=status.HTTP_200_OK)
@router.get("/", response_model=List[UserProfileResponse], status_code=status.HTTP_200_OK, include_in_schema=False)
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"])),
):
    """
    List all system users.
    
    Security: Only accessible to users with role 'admin'.
    """
    return db.query(User).order_by(User.id.desc()).all()
