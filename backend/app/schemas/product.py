"""
Pydantic schemas for Product requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    name: str = Field(..., min_length=1, description="Product name")
    product_type: str = Field(default="goods", description="Product type (goods, service)")
    category: Optional[str] = Field(default=None, description="Product category (e.g. Furniture)")
    price: float = Field(..., ge=0, description="Sales price")
    cost: Optional[float] = Field(default=None, ge=0, description="Cost price")
    tax_percent: float = Field(default=0.0, ge=0, le=100, description="Tax percentage (e.g. 18.0 for 18%)")
    description: Optional[str] = Field(default=None, description="Product description")
    image_url: Optional[str] = Field(default=None, description="Product image data URL")


class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""
    name: Optional[str] = None
    product_type: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    cost: Optional[float] = Field(default=None, ge=0)
    tax_percent: Optional[float] = Field(default=None, ge=0, le=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """Schema for product response."""
    id: int
    name: str
    product_type: str = "goods"
    category: Optional[str] = None
    price: float
    cost: Optional[float] = None
    tax_percent: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    """Paginated list response envelope."""
    data: List[ProductResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1
