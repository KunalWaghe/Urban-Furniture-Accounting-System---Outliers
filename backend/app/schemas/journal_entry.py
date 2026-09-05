"""
Pydantic schemas for Journal Entries and Journal Items (P0-BE-06, P0-BE-11).
"""

from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class JournalItemCreate(BaseModel):
    account_id: int
    partner_id: Optional[int] = None
    debit: float = Field(default=0.0, ge=0.0)
    credit: float = Field(default=0.0, ge=0.0)
    description: Optional[str] = None
    analytic_account_id: Optional[int] = None

    # Validates that a line does not simultaneously hold both debit and credit amounts
    @model_validator(mode="after")
    def validate_single_sided_amount(self) -> "JournalItemCreate":
        if self.debit > 0 and self.credit > 0:
            raise ValueError("A single line cannot specify both a positive debit and positive credit")
        if self.debit == 0 and self.credit == 0:
            raise ValueError("A line must have either a positive debit or positive credit amount")
        return self


class JournalEntryCreate(BaseModel):
    journal_code: str
    reference: Optional[str] = None
    date: Optional[datetime] = None
    items: List[JournalItemCreate]

    # Validates that at least two lines exist and total debits match total credits
    @model_validator(mode="after")
    def validate_balanced_totals(self) -> "JournalEntryCreate":
        if not self.items or len(self.items) < 2:
            raise ValueError("A journal entry requires at least two line items")

        total_debit = round(sum(item.debit for item in self.items), 2)
        total_credit = round(sum(item.credit for item in self.items), 2)

        if total_debit != total_credit:
            raise ValueError(f"Debits ({total_debit:.2f}) and credits ({total_credit:.2f}) must balance")
        return self


class JournalItemResponse(BaseModel):
    account_id: int
    account_name: Optional[str] = None
    account_code: Optional[str] = None
    partner_id: Optional[int] = None
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None
    analytic_account_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class JournalEntryResponse(BaseModel):
    id: int
    entry_number: str
    journal_code: Optional[str] = None
    journal_name: Optional[str] = None
    date: date | datetime
    reference: Optional[str] = None
    total_amount: Optional[float] = None
    is_posted: bool = True
    items: List[JournalItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class JournalEntryListResponse(BaseModel):
    data: List[JournalEntryResponse]
    total: int
    page: int
    limit: int
    pages: int
