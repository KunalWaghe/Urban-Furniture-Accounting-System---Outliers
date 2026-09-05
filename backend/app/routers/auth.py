"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.schemas.auth import (
    RegisterRequest, 
    LoginRequest, 
    AuthResponse, 
    UserProfileResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse
)
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

    NOTE: Currently relies on frontend clearing the stored token.
    The JWT itself remains valid until expiry (hackathon scope).
    For production, implement a server-side token denylist (Redis/DB).
    """
    return {"message": "Successfully logged out"}


@router.post("/forgot-password", response_model=ForgotPasswordResponse, status_code=status.HTTP_200_OK)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password reset process.
    
    Sends a password reset token to the user's email if the account exists.
    Always returns success to prevent email enumeration attacks.
    
    NOTE: In production, this should send an email. For demo purposes,
    the token is logged to console and can be used with /reset-password endpoint.
    """
    return auth_service.forgot_password(db, req)


@router.post("/reset-password", response_model=ResetPasswordResponse, status_code=status.HTTP_200_OK)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using a valid reset token.
    
    The token is obtained from the forgot-password endpoint and is valid for 1 hour.
    """
    return auth_service.reset_password(db, req)
