"""
Contact API endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse, ContactListResponse
from app.services import contact_service
from app.models.user import User

router = APIRouter()


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_contact(req: ContactCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new contact (Customer, Vendor, or Both)."""
    return contact_service.create_contact(db, req)


@router.get("", response_model=ContactListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=ContactListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_contacts(
    type: Optional[str] = Query(None, description="Filter by contact type (customer, vendor, both)"),
    search: Optional[str] = Query(None, description="Search by name, email, or city"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve contacts with optional filtering."""
    contacts, total = contact_service.get_contacts(db, type_filter=type, search=search, is_active=is_active)
    return ContactListResponse(data=contacts, total=total)


@router.get("/{contact_id}", response_model=ContactResponse, status_code=status.HTTP_200_OK)
def get_contact(contact_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get contact details by ID."""
    return contact_service.get_contact_by_id(db, contact_id)


@router.put("/{contact_id}", response_model=ContactResponse, status_code=status.HTTP_200_OK)
def update_contact(contact_id: int, req: ContactUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update contact details."""
    return contact_service.update_contact(db, contact_id, req)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Soft delete a contact (sets is_active=False)."""
    contact_service.delete_contact(db, contact_id)
    return None
