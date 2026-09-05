"""
Pydantic schemas for Journals (P0-BE-04).
"""

from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

JournalType = Literal["sale", "purchase", "bank", "cash"]


class JournalBase(BaseModel):
    code: str = Field(..., json_schema_extra={"example": "SLS"}, description="Unique journal code")
    name: str = Field(..., json_schema_extra={"example": "Sales Journal"}, description="Journal name")
    type: JournalType = Field(..., json_schema_extra={"example": "sale"}, description="Journal type: sale, purchase, bank, cash")
    default_account_id: Optional[int] = Field(None, json_schema_extra={"example": 7}, description="ID of default Chart of Accounts account")


class JournalCreate(JournalBase):
    pass


class JournalUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1, max_length=20)
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[JournalType] = None
    default_account_id: Optional[int] = None
    is_active: Optional[bool] = None


class JournalResponse(JournalBase):
    id: int
    default_account_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JournalListResponse(BaseModel):
    """Paginated list response envelope."""
    data: List[JournalResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1

