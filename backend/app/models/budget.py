"""
Budget database model for financial projections, allocations, and revision history (Phase 6, P1).
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Budget(Base):
    """
    Budget entity setting spending or revenue targets for a specific Analytic Account over a time period.
    Lifecycle states: 'draft', 'confirmed', 'revised', 'cancelled'
    """
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # Target cost/revenue centre foreign key
    analytic_account_id: Mapped[int] = mapped_column(Integer, ForeignKey("analytic_accounts.id"), nullable=False, index=True)
    # Fiscal tracking period boundaries
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    # Target financial allocation or threshold
    committed_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # Lifecycle status: draft -> confirmed -> revised (or cancelled from draft)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    # Optional staff/manager contact responsible for this budget
    responsible_person_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=True, index=True)
    # 'ForeignKey' referencing self enables an immutable linked-list revision history chain
    revised_from_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("budgets.id"), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Bidirectional connection to parent AnalyticAccount
    analytic_account: Mapped["AnalyticAccount"] = relationship("AnalyticAccount", back_populates="budgets")
    # Association with responsible contact
    responsible_person: Mapped[Optional["Contact"]] = relationship("Contact")
    # 'remote_side' keyword specifies target column for self-referential adjacency-list hierarchy
    revised_from: Mapped[Optional["Budget"]] = relationship(
        "Budget",
        remote_side=[id],
        backref="revisions",
    )
