"""
Pydantic schemas for Purchase Order requests and responses (P0-BE-05).
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class POLineCreate(BaseModel):
    """Schema for creating a Purchase Order Line item."""
    product_id: int = Field(..., description="ID of the Product")
    account_id: Optional[int] = Field(default=None, description="Optional Chart of Accounts ID")
    analytic_account_id: Optional[int] = Field(default=None, description="Optional Analytic Account ID")
    quantity: float = Field(..., gt=0, description="Quantity ordered")
    unit_price: float = Field(..., ge=0, description="Unit price")


class POCreate(BaseModel):
    """Schema for creating a Purchase Order."""
    vendor_id: int = Field(..., description="ID of the Vendor (Contact)")
    order_date: Optional[datetime] = Field(default=None, description="Order date")
    lines: List[POLineCreate] = Field(..., min_length=1, description="Line items for the PO")


class POLineResponse(BaseModel):
    """Schema for Purchase Order Line item response."""
    id: int
    product_id: int
    product_name: Optional[str] = None
    account_id: Optional[int] = None
    account_name: Optional[str] = None
    analytic_account_id: Optional[int] = None
    quantity: float
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class POResponse(BaseModel):
    """Schema for Purchase Order detail response."""
    id: int
    po_number: str
    vendor_id: int
    vendor_name: Optional[str] = None
    status: str
    total: float
    order_date: datetime
    created_at: datetime
    lines: List[POLineResponse] = []

    model_config = {"from_attributes": True}


class POListResponse(BaseModel):
    """List envelope for Purchase Orders."""
    data: List[POResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1

