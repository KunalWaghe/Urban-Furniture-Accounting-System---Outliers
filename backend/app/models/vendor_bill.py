"""
Vendor Bill database models (VendorBill, VendorBillLine) (P0-BE-06).
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class VendorBill(Base):
    """
    Vendor Bill entity generated from a confirmed Purchase Order.
    Status values: 'open', 'paid', 'partially_paid'
    """
    __tablename__ = "vendor_bills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    bill_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    po_id: Mapped[int] = mapped_column(Integer, ForeignKey("purchase_orders.id"), unique=True, nullable=False, index=True)
    vendor_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=False, index=True)
    bill_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    # Payment due date for settlement compliance (must be >= bill_date)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    amount_paid: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="open", index=True)
    journal_entry_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    purchase_order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder")
    vendor: Mapped["Contact"] = relationship("Contact")
    journal_entry: Mapped[Optional["JournalEntry"]] = relationship("JournalEntry")
    lines: Mapped[List["VendorBillLine"]] = relationship("VendorBillLine", back_populates="bill", cascade="all, delete-orphan")
    # 'relationship' keyword connects settlements to this bill with cascading cleanup
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="vendor_bill", cascade="all, delete-orphan")


class VendorBillLine(Base):
    """
    Line items for Vendor Bills.
    """
    __tablename__ = "vendor_bill_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    bill_id: Mapped[int] = mapped_column(Integer, ForeignKey("vendor_bills.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=True)
    analytic_account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("analytic_accounts.id", ondelete="SET NULL"), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    bill: Mapped["VendorBill"] = relationship("VendorBill", back_populates="lines")
    product: Mapped["Product"] = relationship("Product")
    account: Mapped[Optional["Account"]] = relationship("Account")
    analytic_account: Mapped[Optional["AnalyticAccount"]] = relationship("AnalyticAccount")
