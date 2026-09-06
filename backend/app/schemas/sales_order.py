"""
Pydantic schemas for Sales Order requests, responses, and list envelopes (Phase 3, P0-BE-05 mirror).
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Schema for validating incoming individual sales order line items
class SOLineCreate(BaseModel):
    """Schema for creating a Sales Order Line item."""
    # 'Field' keyword defines validation constraints and OpenAPI metadata
    product_id: int = Field(..., description="ID of the Product being sold")
    account_id: Optional[int] = Field(default=None, description="Optional Chart of Accounts ID (defaults to 4010 Sales Income)")
    analytic_account_id: Optional[int] = Field(default=None, description="Optional Analytic Cost Center Account ID")
    # 'gt=0' constraint guarantees ordered quantity is strictly positive
    quantity: float = Field(..., gt=0, description="Quantity ordered")
    # 'ge=0' constraint allows zero or positive unit selling price
    unit_price: float = Field(..., ge=0, description="Unit sales price")


# Schema for payload when registering a new sales order in draft status
class SOCreate(BaseModel):
    """Schema for creating a new Sales Order."""
    customer_id: int = Field(..., description="ID of the Customer (Contact entity)")
    order_date: Optional[datetime] = Field(default=None, description="Order placement timestamp")
    tax_percent: float = Field(default=0.0, ge=0, le=100, description="Tax percentage applied to the order total")
    # 'min_length=1' ensures an order must contain at least one line item
    lines: List[SOLineCreate] = Field(..., min_length=1, description="Line items for the sales order")


# Schema for serializing persisted line items with resolved product and account names
class SOLineResponse(BaseModel):
    """Schema for Sales Order Line item response."""
    id: int
    product_id: int
    product_name: Optional[str] = None
    account_id: Optional[int] = None
    account_name: Optional[str] = None
    analytic_account_id: Optional[int] = None
    quantity: float
    unit_price: float
    subtotal: float

    # 'ConfigDict(from_attributes=True)' instructs Pydantic V2 to read attributes from ORM models directly
    model_config = ConfigDict(from_attributes=True)


# Schema representing detailed Sales Order record with nested lines
class SOResponse(BaseModel):
    """Schema for Sales Order detail response."""
    id: int
    so_number: str
    customer_id: int
    customer_name: Optional[str] = None
    status: str
    total: float
    tax_percent: float = 0.0
    tax_amount: float = 0.0
    total_with_tax: float = 0.0
    order_date: datetime
    created_at: datetime
    lines: List[SOLineResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Standard envelope for paginated Sales Order listings
class SOListResponse(BaseModel):
    """Paginated list envelope for Sales Orders."""
    data: List[SOResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1
