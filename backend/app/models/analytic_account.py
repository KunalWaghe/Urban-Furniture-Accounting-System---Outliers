"""
Analytic Account database model for cost centre categorization (Phase 6, P1).
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class AnalyticAccount(Base):
    """
    Analytic Account entity representing cost/revenue centers (e.g., specific projects, departments, or campaigns).
    Used to track budgets and ledger line-item allocations without altering statutory Chart of Accounts.
    """
    __tablename__ = "analytic_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # Unique alphanumeric identifier for the cost centre (e.g. 'ANL-PRJ-01')
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    # Human-readable cost centre title
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # Classification: 'income' or 'expense'
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="expense", index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # 'relationship' enables cascading bidirectional access to associated Budget projections
    budgets: Mapped[List["Budget"]] = relationship("Budget", back_populates="analytic_account", cascade="all, delete-orphan")
