"""
Payment database model for inbound and outbound financial transactions (Phase 2, P0-BE-07).
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Payment(Base):
    """
    Financial Payment record capturing cash or bank movements against bills and invoices.
    Supports 'outbound' (vendor bill settlements) and 'inbound' (customer invoice receipts).
    """
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # Sequential payment identifier e.g., PAY-0001
    payment_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    # 'outbound' (vendor payment) or 'inbound' (customer payment)
    payment_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    # Foreign key referencing the payee or payer Contact
    contact_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=False, index=True)
    # Foreign key referencing the settled VendorBill (nullable for customer invoices or direct payments)
    bill_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("vendor_bills.id"), nullable=True, index=True)
    # Foreign key referencing the settled CustomerInvoice in Phase 3/4
    invoice_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("customer_invoices.id"), nullable=True, index=True)
    # Foreign key referencing the Bank (BNK) or Cash (CSH) Journal
    journal_id: Mapped[int] = mapped_column(Integer, ForeignKey("journals.id"), nullable=False, index=True)
    # Monetized settlement amount
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    # Payment instrument type: 'bank' or 'cash'
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    # Value date for the financial payment
    date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    # Optional memo or transaction description
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Foreign key referencing the automated double-entry JournalEntry
    journal_entry_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("journal_entries.id"), nullable=True, index=True)
    # Lifecycle status: 'draft' or 'posted'
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="posted", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # SQLAlchemy relationship definitions mapping entities
    contact: Mapped["Contact"] = relationship("Contact")
    # 'back_populates' keyword establishes bidirectional sync with VendorBill.payments
    vendor_bill: Mapped[Optional["VendorBill"]] = relationship("VendorBill", back_populates="payments")
    # 'back_populates' keyword connects inbound receipts to customer invoices
    customer_invoice: Mapped[Optional["CustomerInvoice"]] = relationship("CustomerInvoice", back_populates="payments")
    journal: Mapped["Journal"] = relationship("Journal")
    journal_entry: Mapped[Optional["JournalEntry"]] = relationship("JournalEntry")
