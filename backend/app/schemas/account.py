"""
Pydantic schemas for Chart of Accounts (P0-BE-04).
"""

from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

AccountType = Literal["asset", "liability", "capital", "income", "expense", "other_expense"]


class AccountBase(BaseModel):
    code: str = Field(..., example="1010", description="Unique account code")
    name: str = Field(..., example="Cash", description="Account name")
    type: AccountType = Field(..., example="asset", description="Account type")
    description: Optional[str] = Field(None, example="Main cash account")


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1, max_length=20)
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[AccountType] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class AccountResponse(AccountBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccountListResponse(BaseModel):
    """Paginated list response envelope."""
    data: List[AccountResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1

