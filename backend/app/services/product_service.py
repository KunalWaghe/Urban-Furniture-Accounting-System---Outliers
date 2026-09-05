"""
Business logic service for Product operations.
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.exceptions import NotFoundException


import math
from sqlalchemy import asc, desc

PRODUCT_SORT_MAP = {
    "name": Product.name,
    "price": Product.price,
    "cost": Product.cost,
    "category": Product.category,
    "id": Product.id,
}


def create_product(db: Session, req: ProductCreate) -> Product:
    """Create a new product."""
    product = Product(
        name=req.name,
        product_type=req.product_type,
        category=req.category,
        price=req.price,
        cost=req.cost,
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
    category: Optional[str] = None,
    product_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "name",
    sort_order: str = "asc",
) -> Tuple[List[Product], int, int, int, int]:
    """Retrieve products with optional filtering, sorting, and pagination."""
    query = db.query(Product)

    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))

    if product_type:
        query = query.filter(Product.product_type == product_type)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.category.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    total = query.count()
    sort_col = PRODUCT_SORT_MAP.get(sort_by, Product.name)
    order_func = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    products = query.offset(offset).limit(limit).all()
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1
    return products, total, page, limit, pages



def get_product_by_id(db: Session, product_id: int) -> Product:
    """Retrieve a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise NotFoundException("Product", product_id)
    return product


def update_product(db: Session, product_id: int, req: ProductUpdate) -> Product:
    """Update an existing product."""
    product = get_product_by_id(db, product_id)

    for field in ["name", "product_type", "category", "price", "cost", "tax_percent", "description", "is_active"]:
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
