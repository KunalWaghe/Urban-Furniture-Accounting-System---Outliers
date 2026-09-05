"""
Product API endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.services import product_service
from app.models.user import User

router = APIRouter()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_product(req: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new product item."""
    return product_service.create_product(db, req)


@router.get("", response_model=ProductListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=ProductListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_products(
    search: Optional[str] = Query(None, description="Search product name or description"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve products with optional filtering."""
    products, total = product_service.get_products(db, search=search, is_active=is_active)
    return ProductListResponse(data=products, total=total)


@router.get("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get product details by ID."""
    return product_service.get_product_by_id(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
def update_product(product_id: int, req: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update product details."""
    return product_service.update_product(db, product_id, req)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Soft delete a product (sets is_active=False)."""
    product_service.delete_product(db, product_id)
    return None
