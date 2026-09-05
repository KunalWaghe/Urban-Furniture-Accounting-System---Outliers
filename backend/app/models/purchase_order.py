"""
Purchase Order database models (PurchaseOrder, PurchaseOrderLine).
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PurchaseOrder(Base):
    """
    Purchase Order entity (P0-BE-05).
    Status values: 'draft', 'confirmed', 'cancelled'
    """
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    po_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    vendor_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=False, index=True)
    order_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vendor: Mapped["Contact"] = relationship("Contact")
    lines: Mapped[List["PurchaseOrderLine"]] = relationship("PurchaseOrderLine", back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderLine(Base):
    """
    Line items for Purchase Orders.
    """
    __tablename__ = "purchase_order_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    po_id: Mapped[int] = mapped_column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=True)
    analytic_account_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    purchase_order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="lines")
    product: Mapped["Product"] = relationship("Product")
    account: Mapped[Optional["Account"]] = relationship("Account")
