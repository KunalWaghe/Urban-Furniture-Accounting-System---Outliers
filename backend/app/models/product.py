"""
Product database model.
"""

from typing import Optional
from sqlalchemy import String, Integer, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Product(Base):
    """
    Product entity representing furniture items / goods / services.
    """
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    product_type: Mapped[str] = mapped_column(String(50), nullable=False, default="goods")  # goods, service
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Furniture, Electronics, etc.
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)  # Sales price
    cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)  # Cost price
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0.0)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
