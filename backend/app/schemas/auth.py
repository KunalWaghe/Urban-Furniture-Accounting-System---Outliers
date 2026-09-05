"""
Pydantic schemas for authentication requests and responses.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Schema for user registration request."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (at least 8 characters)")
    name: str = Field(..., min_length=1, description="User full name")
    role: str = Field(default="invoicing_user", description="Role: admin, invoicing_user, or contact")
    contact_id: Optional[int] = Field(default=None, description="Optional contact ID link for contact role")


class LoginRequest(BaseModel):
    """Schema for user login request."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class AuthResponse(BaseModel):
    """Schema for authentication response containing user info and JWT token."""
    id: int
    email: str
    name: str
    role: str
    token: str

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    """Schema for user profile (/me endpoint)."""
    id: int
    email: str
    name: str
    role: str
    contact_id: Optional[int] = None
    is_active: bool

    model_config = {"from_attributes": True}
