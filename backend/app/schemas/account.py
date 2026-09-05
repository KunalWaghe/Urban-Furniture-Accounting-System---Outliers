"""
Pydantic schemas for Chart of Accounts (P0-BE-04).
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AccountBase(BaseModel):
    code: str = Field(..., example="1010", description="Unique account code")
    name: str = Field(..., example="Cash", description="Account name")
    type: str = Field(..., example="asset", description="Account type: asset, liability, capital, income, expense")
    description: Optional[str] = Field(None, example="Main cash account")


class AccountCreate(AccountBase):
    pass


class AccountResponse(AccountBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccountListResponse(BaseModel):
    data: List[AccountResponse]
    total: int
