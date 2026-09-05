"""
Pydantic schemas for Journals (P0-BE-04).
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class JournalBase(BaseModel):
    code: str = Field(..., json_schema_extra={"example": "SLS"}, description="Unique journal code")
    name: str = Field(..., json_schema_extra={"example": "Sales Journal"}, description="Journal name")
    type: str = Field(..., json_schema_extra={"example": "sale"}, description="Journal type: sale, purchase, bank, cash")
    default_account_id: Optional[int] = Field(None, json_schema_extra={"example": 7}, description="ID of default Chart of Accounts account")


class JournalCreate(JournalBase):
    pass


class JournalResponse(JournalBase):
    id: int
    default_account_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JournalListResponse(BaseModel):
    data: List[JournalResponse]
    total: int
