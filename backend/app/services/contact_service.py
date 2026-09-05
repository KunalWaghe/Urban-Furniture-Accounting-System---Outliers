"""
Business logic service for Contact operations.
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate
from app.core.exceptions import NotFoundException, ValidationException

import math
from sqlalchemy import asc, desc

VALID_TYPES = {"customer", "vendor", "both"}
CONTACT_SORT_MAP = {
    "name": Contact.name,
    "type": Contact.type,
    "city": Contact.city,
    "id": Contact.id,
}


def create_contact(db: Session, req: ContactCreate) -> Contact:
    """Create a new contact."""
    if req.type not in VALID_TYPES:
        raise ValidationException(f"Invalid contact type '{req.type}'. Must be one of: {', '.join(VALID_TYPES)}")

    contact = Contact(
        name=req.name,
        type=req.type,
        email=req.email,
        mobile=req.mobile,
        city=req.city,
        state=req.state,
        pincode=req.pincode,
        is_active=True,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def get_contacts(
    db: Session,
    type_filter: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "name",
    sort_order: str = "asc",
) -> Tuple[List[Contact], int, int, int, int]:
    """Retrieve contacts with optional filtering, sorting, and pagination."""
    query = db.query(Contact)

    if type_filter:
        # Note: 'both' type applies to both 'customer' and 'vendor' queries
        if type_filter in ("customer", "vendor"):
            query = query.filter(or_(Contact.type == type_filter, Contact.type == "both"))
        else:
            query = query.filter(Contact.type == type_filter)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Contact.name.ilike(search_term),
                Contact.email.ilike(search_term),
                Contact.city.ilike(search_term),
            )
        )

    if is_active is not None:
        query = query.filter(Contact.is_active == is_active)

    total = query.count()
    sort_col = CONTACT_SORT_MAP.get(sort_by, Contact.name)
    order_func = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_func(sort_col))

    offset = (page - 1) * limit
    contacts = query.offset(offset).limit(limit).all()
    pages = math.ceil(total / limit) if limit > 0 and total > 0 else 1
    return contacts, total, page, limit, pages



def get_contact_by_id(db: Session, contact_id: int) -> Contact:
    """Retrieve a single contact by ID."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise NotFoundException("Contact", contact_id)
    return contact


def update_contact(db: Session, contact_id: int, req: ContactUpdate) -> Contact:
    """Update an existing contact."""
    contact = get_contact_by_id(db, contact_id)

    if req.type is not None:
        if req.type not in VALID_TYPES:
            raise ValidationException(f"Invalid contact type '{req.type}'. Must be one of: {', '.join(VALID_TYPES)}")
        contact.type = req.type

    for field in ["name", "email", "mobile", "city", "state", "pincode", "is_active"]:
        val = getattr(req, field)
        if val is not None:
            setattr(contact, field, val)

    db.commit()
    db.refresh(contact)
    return contact


def delete_contact(db: Session, contact_id: int) -> None:
    """Soft-delete a contact by setting is_active=False."""
    contact = get_contact_by_id(db, contact_id)
    contact.is_active = False
    db.commit()
