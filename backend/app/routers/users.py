"""
User management API endpoints (Admin only).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.models.user import User
from app.schemas.auth import AdminUserCreateRequest, UserProfileResponse
from app.services import auth_service

router = APIRouter()


@router.post("", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_user(
    req: AdminUserCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"])),
):
    """
    Admin-only endpoint to create system users, accountants, or portal users.
    Enforces role-based permissions (admin role required).
    """
    return auth_service.admin_create_user(db, req)
