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
    search: Optional[str] = Query(None, description="Search product name, category, or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    product_type: Optional[str] = Query(None, description="Filter by product type (goods, service, combo)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("name", description="Field to sort by (name, price, cost, category, id)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve products with optional filtering, sorting, and pagination."""
    products, total, page, limit, pages = product_service.get_products(
        db,
        search=search,
        category=category,
        product_type=product_type,
        is_active=is_active,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return ProductListResponse(data=products, total=total, page=page, limit=limit, pages=pages)



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
