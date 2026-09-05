"""
Analytic Account model (budget analytics / cost centers).
"""

from sqlalchemy import String, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AnalyticAccount(Base):
    """
    Analytic account used on PO lines for budget tracking.
    """

    __tablename__ = "analytic_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    budget_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
