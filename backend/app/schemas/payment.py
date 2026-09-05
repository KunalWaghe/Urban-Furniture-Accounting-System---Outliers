"""
Pydantic schemas for Payment creation, listing, and responses (Phase 2, P0-BE-07).
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# Request schema for direct bill settlement payments
class BillPayRequest(BaseModel):
    # 'gt' keyword enforces positive currency amounts strictly greater than zero
    amount: float = Field(gt=0, description="Payment amount must be greater than zero")
    # 'pattern' keyword ensures only bank or cash instruments are accepted
    payment_method: str = Field(pattern="^(bank|cash)$", description="Method of payment: 'bank' or 'cash'")
    date: Optional[datetime] = Field(None, description="Optional payment date, defaults to current UTC time")
    note: Optional[str] = Field(None, max_length=255, description="Optional notes or reference memo")


# General request schema for unified payments endpoint
class PaymentCreate(BaseModel):
    payment_type: str = Field(pattern="^(outbound|inbound)$", description="'outbound' (vendor) or 'inbound' (customer)")
    bill_id: Optional[int] = Field(None, description="Target Vendor Bill ID (required for outbound bill settlements)")
    invoice_id: Optional[int] = Field(None, description="Target Customer Invoice ID (reserved for Phase 4)")
    # 'gt' keyword guarantees amount is strictly positive
    amount: float = Field(gt=0, description="Monetary amount to settle")
    payment_method: str = Field(pattern="^(bank|cash)$", description="Method: 'bank' or 'cash'")
    date: Optional[datetime] = Field(None, description="Payment transaction date")
    note: Optional[str] = Field(None, max_length=255, description="Transaction notes or comments")


# Response schema representing a recorded payment transaction
class PaymentResponse(BaseModel):
    id: int
    payment_number: str
    payment_type: str
    contact_id: int
    contact_name: Optional[str] = None
    bill_id: Optional[int] = None
    bill_number: Optional[str] = None
    invoice_id: Optional[int] = None
    journal_id: int
    journal_code: Optional[str] = None
    journal_name: Optional[str] = None
    amount: float
    payment_method: str
    date: datetime
    note: Optional[str] = None
    journal_entry_id: Optional[int] = None
    journal_entry_number: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    # 'from_attributes' keyword instructs Pydantic to read values directly from ORM model instances
    model_config = ConfigDict(from_attributes=True)


# Response schema for paginated payment queries
class PaymentListResponse(BaseModel):
    data: List[PaymentResponse]
    total: int
    page: int
    limit: int
    pages: int
