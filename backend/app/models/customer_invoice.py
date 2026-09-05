"""
Customer Invoice database models (CustomerInvoice, CustomerInvoiceLine) (Phase 3, P0-BE-06 mirror).
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CustomerInvoice(Base):
    """
    Customer Invoice entity generated from a confirmed Sales Order or created directly.
    Status values: 'open', 'partially_paid', 'paid', 'cancelled'
    """
    __tablename__ = "customer_invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # Sequential invoice identifier formatted as INV-0001
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    # Optional unique link to originate SalesOrder
    so_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("sales_orders.id"), unique=True, nullable=True, index=True)
    # Customer contact foreign key
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=False, index=True)
    # Date of invoice issuance
    invoice_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    # Payment due date
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    # Total invoice amount
    total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # Cumulative receipts settled against this invoice
    amount_paid: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # Lifecycle status: 'open', 'partially_paid', 'paid', 'cancelled'
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="open", index=True)
    # Auto-posted double-entry journal entry reference
    journal_entry_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sales_order: Mapped[Optional["SalesOrder"]] = relationship("SalesOrder")
    customer: Mapped["Contact"] = relationship("Contact")
    journal_entry: Mapped[Optional["JournalEntry"]] = relationship("JournalEntry")
    # 'cascade' keyword ensures orphan deletion when invoice is deleted
    lines: Mapped[List["CustomerInvoiceLine"]] = relationship(
        "CustomerInvoiceLine",
        back_populates="invoice",
        cascade="all, delete-orphan",
    )
    # 'back_populates' keyword links customer invoice settlements bidirectionally with Payment model
    payments: Mapped[List["Payment"]] = relationship(
        "Payment",
        back_populates="customer_invoice",
        cascade="all, delete-orphan",
    )


class CustomerInvoiceLine(Base):
    """
    Line items for Customer Invoices detailing products, quantities, and income accounts.
    """
    __tablename__ = "customer_invoice_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # Cascading foreign key to parent invoice
    invoice_id: Mapped[int] = mapped_column(Integer, ForeignKey("customer_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=True)
    analytic_account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("analytic_accounts.id", ondelete="SET NULL"), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Relationship back to parent CustomerInvoice
    invoice: Mapped["CustomerInvoice"] = relationship("CustomerInvoice", back_populates="lines")
    product: Mapped["Product"] = relationship("Product")
    account: Mapped[Optional["Account"]] = relationship("Account")
    analytic_account: Mapped[Optional["AnalyticAccount"]] = relationship("AnalyticAccount")
