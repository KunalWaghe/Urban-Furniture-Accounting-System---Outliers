"""
Pydantic schemas for Contact requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class ContactCreate(BaseModel):
    """Schema for creating a new contact."""
    name: str = Field(..., min_length=1, description="Contact name")
    type: str = Field(default="customer", description="Contact type: customer, vendor, or both")
    email: Optional[EmailStr] = Field(default=None, description="Contact email address")
    mobile: Optional[str] = Field(default=None, description="Contact mobile number")
    city: Optional[str] = Field(default=None, description="City")
    state: Optional[str] = Field(default=None, description="State")
    pincode: Optional[str] = Field(default=None, description="Pincode / Postal code")


class ContactUpdate(BaseModel):
    """Schema for updating an existing contact."""
    name: Optional[str] = None
    type: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_active: Optional[bool] = None


class ContactResponse(BaseModel):
    """Schema for contact response."""
    id: int
    name: str
    type: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ContactListResponse(BaseModel):
    """Paginated list response envelope."""
    data: List[ContactResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1

