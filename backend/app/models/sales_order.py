"""
Sales Order database models (SalesOrder, SalesOrderLine) (Phase 3, P0-BE-05 mirror).
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SalesOrder(Base):
    """
    Sales Order entity representing customer orders.
    Lifecycle status values: 'draft', 'confirmed', 'invoiced', 'cancelled'
    """
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # Sequential order identifier formatted as SO-0001
    so_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    # Foreign key referencing the customer Contact
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=False, index=True)
    # Order placement timestamp
    order_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    # Order status
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    # Total order amount computed from lines
    total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    customer: Mapped["Contact"] = relationship("Contact")
    # 'cascade' keyword ensures lines are automatically removed when order is deleted
    lines: Mapped[List["SalesOrderLine"]] = relationship(
        "SalesOrderLine",
        back_populates="sales_order",
        cascade="all, delete-orphan",
    )


class SalesOrderLine(Base):
    """
    Line items for Sales Orders with product pricing and account mappings.
    """
    __tablename__ = "sales_order_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # 'ondelete="CASCADE"' foreign key automatically deletes lines if parent sales order row is removed
    so_id: Mapped[int] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    # Optional revenue income account (defaults to Sales Income 4010 if omitted)
    account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=True)
    analytic_account_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # 'back_populates' keyword establishes bidirectional sync with SalesOrder.lines
    sales_order: Mapped["SalesOrder"] = relationship("SalesOrder", back_populates="lines")
    product: Mapped["Product"] = relationship("Product")
    account: Mapped[Optional["Account"]] = relationship("Account")
