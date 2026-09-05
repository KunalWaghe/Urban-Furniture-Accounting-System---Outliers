"""
Pydantic schemas for Vendor Bills (P0-BE-06).
"""

from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.journal_entry import JournalEntryResponse


class VendorBillLineResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    account_id: Optional[int] = None
    account_name: Optional[str] = None
    analytic_account_id: Optional[int] = None
    quantity: float
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class VendorBillResponse(BaseModel):
    id: int
    bill_number: str
    po_id: int
    vendor_id: int
    vendor_name: Optional[str] = None
    bill_date: date | datetime
    due_date: Optional[date | datetime] = None
    total: float
    amount_paid: float = 0.0
    status: str = "open"
    journal_entry_id: Optional[int] = None
    lines: Optional[List[VendorBillLineResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class CreateBillResponse(BaseModel):
    bill: VendorBillResponse
    journal_entry: JournalEntryResponse


class VendorBillListResponse(BaseModel):
    data: List[VendorBillResponse]
    total: int
    page: int
    limit: int
    pages: int
