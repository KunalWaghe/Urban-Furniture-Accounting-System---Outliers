"""
Pydantic schemas for Analytic Accounts.
"""

from typing import List
from pydantic import BaseModel


class AnalyticAccountResponse(BaseModel):
    id: int
    name: str
    budget_amount: float
    committed_amount: float
    remaining_amount: float


class AnalyticAccountListResponse(BaseModel):
    data: List[AnalyticAccountResponse]
