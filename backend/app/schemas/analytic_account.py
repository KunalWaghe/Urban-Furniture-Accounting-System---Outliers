"""
Pydantic schemas for Analytic Account cost center requests and responses (Phase 6, P1).
"""

from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


class AnalyticAccountCreate(BaseModel):
    """
    Schema for initializing an Analytic Account cost/revenue center.
    """
    # Unique code identifier such as 'PRJ-MUMBAI-01'
    code: str = Field(..., min_length=1, max_length=50, description="Unique cost centre code")
    name: str = Field(..., min_length=1, max_length=100, description="Cost centre or project name")
    # 'Literal' restricts valid types strictly to 'income' or 'expense'
    type: Literal["income", "expense"] = Field(default="expense", description="Classification: income or expense")
    description: Optional[str] = Field(default=None, description="Detailed operational purpose")


class AnalyticAccountUpdate(BaseModel):
    """
    Schema for modifying metadata or active state of an Analytic Account.
    """
    code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[Literal["income", "expense"]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class AnalyticAccountResponse(BaseModel):
    """
    Full serialized representation of an Analytic Account.
    """
    id: int
    code: str
    name: str
    type: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # 'from_attributes=True' enables automatic ORM model deserialization (Pydantic V2)
    model_config = ConfigDict(from_attributes=True)


class AnalyticAccountListResponse(BaseModel):
    """
    Standard paginated envelope for Analytic Account listings.
    """
    data: List[AnalyticAccountResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1
