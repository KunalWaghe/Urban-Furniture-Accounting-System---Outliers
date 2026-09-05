"""
Business logic service for Product operations.
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.exceptions import NotFoundException


def create_product(db: Session, req: ProductCreate) -> Product:
    """Create a new product."""
    product = Product(
        name=req.name,
        price=req.price,
        tax_percent=req.tax_percent,
        description=req.description,
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_products(
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Tuple[List[Product], int]:
    """Retrieve products with optional search and is_active filters."""
    query = db.query(Product)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    total = query.count()
    products = query.order_by(Product.name.asc()).all()
    return products, total


def get_product_by_id(db: Session, product_id: int) -> Product:
    """Retrieve a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise NotFoundException("Product", product_id)
    return product


def update_product(db: Session, product_id: int, req: ProductUpdate) -> Product:
    """Update an existing product."""
    product = get_product_by_id(db, product_id)

    for field in ["name", "price", "tax_percent", "description", "is_active"]:
        val = getattr(req, field)
        if val is not None:
            setattr(product, field, val)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    """Soft-delete a product by setting is_active=False."""
    product = get_product_by_id(db, product_id)
    product.is_active = False
    db.commit()
