"""
Contact role self-service endpoints — restricted view for 'contact' role users.
Allows contacts to view their own invoices and bills, and make payments against them.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.schemas.customer_invoice import CustomerInvoiceResponse, CustomerInvoiceListResponse
from app.schemas.vendor_bill import VendorBillResponse, VendorBillListResponse
from app.schemas.payment import InvoicePayRequest, BillPayRequest, PaymentResponse
from app.services import customer_invoice_service, vendor_bill_service, payment_service, contact_service
from app.models.user import User
from app.models.contact import Contact
from app.core.exceptions import ForbiddenException

# Self-service router: authenticated users only (any role can access their own data)
router = APIRouter()


def _get_contact_for_user(db: Session, user: User) -> Contact:
    """Resolve or create the Contact entity linked to the current portal user."""
    contact = contact_service.ensure_contact_for_portal_user(
        db,
        name=user.name,
        email=user.email,
        user=user,
    )
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/my-invoices", response_model=CustomerInvoiceListResponse, status_code=status.HTTP_200_OK)
def list_my_invoices(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List invoices associated with the current user's contact record."""
    contact = _get_contact_for_user(db, current_user)
    invoices, total, page, limit, pages = customer_invoice_service.list_customer_invoices(
        db, status=status_filter, customer_id=contact.id, page=page, limit=limit,
    )
    return CustomerInvoiceListResponse(data=invoices, total=total, page=page, limit=limit, pages=pages)


@router.get("/my-bills", response_model=VendorBillListResponse, status_code=status.HTTP_200_OK)
def list_my_bills(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List vendor bills associated with the current user's contact record."""
    contact = _get_contact_for_user(db, current_user)
    bills, total, page, limit, pages = vendor_bill_service.list_vendor_bills(
        db, status=status_filter, vendor_id=contact.id, page=page, limit=limit,
    )
    return VendorBillListResponse(data=bills, total=total, page=page, limit=limit, pages=pages)


@router.post("/my-invoices/{invoice_id}/pay", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def pay_my_invoice(
    invoice_id: int,
    req: InvoicePayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Make a payment against one of the current user's own invoices."""
    contact = _get_contact_for_user(db, current_user)
    # Verify the invoice belongs to this contact
    invoice = customer_invoice_service.get_customer_invoice(db, invoice_id)
    if invoice.customer_id != contact.id:
        raise ForbiddenException("You can only pay your own invoices")
    return payment_service.create_inbound_payment(
        db=db, invoice_id=invoice_id, amount=req.amount,
        payment_method=req.payment_method, date=req.date, note=req.note,
    )


@router.post("/my-bills/{bill_id}/pay", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def pay_my_bill(
    bill_id: int,
    req: BillPayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Make a payment against one of the current user's own vendor bills."""
    contact = _get_contact_for_user(db, current_user)
    # Verify the bill belongs to this contact
    bill = vendor_bill_service.get_vendor_bill(db, bill_id)
    if bill.vendor_id != contact.id:
        raise ForbiddenException("You can only pay your own bills")
    return payment_service.create_outbound_payment(
        db=db, bill_id=bill_id, amount=req.amount,
        payment_method=req.payment_method, date=req.date, note=req.note,
    )
