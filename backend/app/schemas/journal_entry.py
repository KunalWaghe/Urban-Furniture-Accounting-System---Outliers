"""
Pydantic schemas for Journal Entries and Journal Items (P0-BE-06, P0-BE-11).
"""

from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class JournalItemResponse(BaseModel):
    account_id: int
    account_name: Optional[str] = None
    account_code: Optional[str] = None
    partner_id: Optional[int] = None
    debit: float = 0.0
    credit: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class JournalEntryResponse(BaseModel):
    id: int
    entry_number: str
    journal_code: Optional[str] = None
    journal_name: Optional[str] = None
    date: date | datetime
    reference: Optional[str] = None
    total_amount: Optional[float] = None
    items: List[JournalItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class JournalEntryListResponse(BaseModel):
    data: List[JournalEntryResponse]
    total: int
    page: int
    limit: int
    pages: int
