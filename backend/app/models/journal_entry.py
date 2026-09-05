"""
Journal Entry and Journal Item models for double-entry bookkeeping (P0-BE-06, P0-BE-11).
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class JournalEntry(Base):
    """
    Journal Entry header representing a general ledger transaction.
    """
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    entry_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    journal_id: Mapped[int] = mapped_column(Integer, ForeignKey("journals.id"), nullable=False, index=True)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    is_posted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    journal: Mapped["Journal"] = relationship("Journal")
    items: Mapped[List["JournalItem"]] = relationship("JournalItem", back_populates="journal_entry", cascade="all, delete-orphan")


class JournalItem(Base):
    """
    Debit and Credit ledger line items for a Journal Entry.
    """
    __tablename__ = "journal_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    journal_entry_id: Mapped[int] = mapped_column(Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    partner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=True, index=True)
    debit: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    credit: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analytic_account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("analytic_accounts.id", ondelete="SET NULL"), nullable=True)

    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="items")
    account: Mapped["Account"] = relationship("Account")
    partner: Mapped[Optional["Contact"]] = relationship("Contact")
    analytic_account: Mapped[Optional["AnalyticAccount"]] = relationship("AnalyticAccount")
