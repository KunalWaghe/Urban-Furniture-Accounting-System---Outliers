"""
Pydantic schemas for authentication requests and responses.
"""

import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Schema for public user registration (creates user/contact role)."""
    login_id: str = Field(..., min_length=6, max_length=12, description="Unique login ID (6 to 12 characters)")
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Password (> 8 chars, 1 uppercase, 1 lowercase, 1 special char)")
    name: Optional[str] = Field(default=None, description="User full name (defaults to login_id if not provided)")
    role: Optional[str] = Field(default="contact", description="Public signup role (defaults to user/contact, admin not allowed)")
    contact_id: Optional[int] = Field(default=None, description="Optional contact ID link for portal user role")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> str:
        if v is not None:
            normalized = v.strip().lower()
            if normalized in ("admin", "administrator"):
                raise ValueError("Registration with admin role is forbidden")
        return v or "contact"

    @field_validator("login_id")
    @classmethod
    def validate_login_id(cls, v: str) -> str:
        v = v.strip()
        if not (6 <= len(v) <= 12):
            raise ValueError("Login Id must be between 6 and 12 characters long")
        if not re.match(r'^[A-Za-z0-9]+$', v):
            raise ValueError("Login Id must contain only letters and numbers")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        if len(v) <= 8:
            raise ValueError("Password must have more than 8 characters")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[^a-zA-Z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class AdminUserCreateRequest(BaseModel):
    """Schema for Admin-created user with role selection (Admin only)."""
    login_id: str = Field(..., min_length=6, max_length=12, description="Unique login ID (6 to 12 characters)")
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Password (> 8 chars, 1 uppercase, 1 lowercase, 1 special char)")
    name: str = Field(..., description="User full name")
    role: str = Field(default="invoicing_user", description="Role: admin, invoicing_user, or contact")
    contact_id: Optional[int] = Field(default=None, description="Optional contact ID link for portal contact role")

    @field_validator("login_id")
    @classmethod
    def validate_login_id(cls, v: str) -> str:
        v = v.strip()
        if not (6 <= len(v) <= 12):
            raise ValueError("Login Id must be between 6 and 12 characters long")
        if not re.match(r'^[A-Za-z0-9]+$', v):
            raise ValueError("Login Id must contain only letters and numbers")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        if len(v) <= 8:
            raise ValueError("Password must have more than 8 characters")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[^a-zA-Z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    """Schema for user login request by Login ID or Email."""
    login_id: str = Field(..., description="User Login ID or Email address")
    password: str = Field(..., description="User password")


class AuthResponse(BaseModel):
    """Schema for authentication response containing user info and JWT token."""
    id: int
    login_id: Optional[str] = None
    email: str
    name: str
    role: str
    token: str

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    """Schema for user profile (/me endpoint)."""
    id: int
    login_id: Optional[str] = None
    email: str
    name: str
    role: str
    contact_id: Optional[int] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr = Field(..., description="User email address")


class ForgotPasswordResponse(BaseModel):
    """Schema for forgot password response."""
    message: str
    email: str


class ResetPasswordRequest(BaseModel):
    """Schema for reset password request."""
    token: str = Field(..., description="Password reset token from email")
    new_password: str = Field(..., description="New password (> 8 chars, 1 uppercase, 1 lowercase, 1 special char)")

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        if len(v) <= 8:
            raise ValueError("Password must have more than 8 characters")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[^a-zA-Z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class ResetPasswordResponse(BaseModel):
    """Schema for reset password response."""
    message: str
