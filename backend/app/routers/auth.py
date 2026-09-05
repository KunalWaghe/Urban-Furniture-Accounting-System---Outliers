"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse
from app.services import auth_service
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new user account.
    
    Returns user details and a JWT token upon successful registration.
    """
    return auth_service.register_user(db, req)


@router.post("/login", response_model=AuthResponse, status_code=status.HTTP_200_OK)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user credentials.
    
    Returns user details and a JWT token upon successful login.
    """
    return auth_service.login_user(db, req)


@router.get("/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user profile.
    """
    return current_user


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
    """
    Log out the current authenticated user and invalidate session.
    """
    return {"message": "Successfully logged out"}
