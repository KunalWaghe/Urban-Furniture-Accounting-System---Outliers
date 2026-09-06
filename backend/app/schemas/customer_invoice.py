"""
Pydantic schemas for Customer Invoices, lines, responses, and list envelopes (Phase 3, P0-BE-06 mirror).
"""

from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.journal_entry import JournalEntryResponse


# Schema for serializing customer invoice line items
class CustomerInvoiceLineResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    account_id: Optional[int] = None
    account_name: Optional[str] = None
    analytic_account_id: Optional[int] = None
    quantity: float
    unit_price: float
    subtotal: float

    # 'ConfigDict(from_attributes=True)' instructs Pydantic to read ORM object attributes
    model_config = ConfigDict(from_attributes=True)


# Detailed Customer Invoice response schema
class CustomerInvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    so_id: Optional[int] = None
    so_number: Optional[str] = None
    customer_id: int
    customer_name: Optional[str] = None
    invoice_date: date | datetime
    due_date: Optional[date | datetime] = None
    total: float
    tax_percent: float = 0.0
    tax_amount: float = 0.0
    total_with_tax: float = 0.0
    amount_paid: float = 0.0
    status: str = "open"
    journal_entry_id: Optional[int] = None
    lines: Optional[List[CustomerInvoiceLineResponse]] = None

    model_config = ConfigDict(from_attributes=True)


# Composite schema returned when a Sales Order is invoiced, containing both invoice and auto-posted journal entry
class CreateInvoiceResponse(BaseModel):
    invoice: CustomerInvoiceResponse
    journal_entry: JournalEntryResponse


# Standard envelope for paginated Customer Invoices
class CustomerInvoiceListResponse(BaseModel):
    data: List[CustomerInvoiceResponse]
    total: int
    page: int
    limit: int
    pages: int
