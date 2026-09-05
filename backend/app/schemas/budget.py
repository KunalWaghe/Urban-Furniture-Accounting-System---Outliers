"""
Pydantic schemas for Budget projection modeling, revision requests, and performance tracking (Phase 6, P1).
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator


class BudgetCreate(BaseModel):
    """
    Schema for initializing a new draft Budget.
    """
    name: str = Field(..., min_length=1, max_length=100, description="Descriptive title of the budget")
    analytic_account_id: int = Field(..., description="Target cost/revenue centre ID")
    period_start: datetime = Field(..., description="Start date and time of budget period")
    period_end: datetime = Field(..., description="End date and time of budget period")
    committed_amount: float = Field(..., gt=0.0, description="Allocated financial amount or threshold")
    responsible_person_id: Optional[int] = Field(default=None, description="Optional contact ID for accountable manager")

    # 'model_validator' evaluates cross-field consistency between period_start and period_end
    @model_validator(mode="after")
    def validate_period_chronology(self) -> "BudgetCreate":
        if self.period_end <= self.period_start:
            raise ValueError("period_end must be chronologically after period_start")
        return self


class BudgetRevise(BaseModel):
    """
    Schema for creating a revision off an existing confirmed Budget.
    """
    name: Optional[str] = Field(default=None, min_length=1, max_length=100, description="Optional updated budget title")
    committed_amount: float = Field(..., gt=0.0, description="Newly revised committed target amount")
    responsible_person_id: Optional[int] = Field(default=None, description="Updated contact ID of accountable manager")


class BudgetResponse(BaseModel):
    """
    Complete representation of a Budget with real-time computed performance statistics.
    """
    id: int
    name: str
    analytic_account_id: int
    analytic_account_name: Optional[str] = None
    analytic_account_type: Optional[str] = None
    period_start: datetime
    period_end: datetime
    committed_amount: float
    status: str
    responsible_person_id: Optional[int] = None
    responsible_person_name: Optional[str] = None
    revised_from_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Dynamically calculated performance metrics derived live from ledger transactions
    achieved_amount: float = 0.0
    achieved_pct: float = 0.0
    amount_to_achieve: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class BudgetListResponse(BaseModel):
    """
    Standard paginated envelope for Budget queries.
    """
    data: List[BudgetResponse]
    total: int
    page: int = 1
    limit: int = 20
    pages: int = 1
