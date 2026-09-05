"""
Unit & Integration tests for Financial Payments and Vendor Bill settlements (Phase 2, P0-BE-07).
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.core.database import engine, Base, SessionLocal
from app.models.contact import Contact
from app.models.product import Product
from app.models.account import Account
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.vendor_bill import VendorBill, VendorBillLine
from app.models.sales_order import SalesOrder, SalesOrderLine
from app.models.customer_invoice import CustomerInvoice, CustomerInvoiceLine
from app.models.journal_entry import JournalEntry, JournalItem
from app.services.accounting_service import seed_accounting_defaults


# Fixture ensuring database tables and accounting defaults are prepared prior to every test
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_accounting_defaults(db)
    # 'yield' pauses the fixture execution while test runs and resumes afterwards
    yield


# Helper creating a complete billed Purchase Order and Vendor Bill for testing payments
def _create_test_bill(total_amount: float = 1000.0) -> int:
    with SessionLocal() as db:
        unique = uuid.uuid4().hex[:6]
        vendor = Contact(
            name=f"Vendor Payee {unique}",
            email=f"vendor_{unique}@testpay.com",
            type="vendor",
        )
        db.add(vendor)
        db.flush()

        product = Product(
            name=f"Office Desk {unique}",
            price=total_amount,
            cost=total_amount,
            product_type="goods",
        )
        db.add(product)
        db.flush()

        expense_acc = db.scalar(select(Account).where(Account.code == "5010"))

        po = PurchaseOrder(
            po_number=f"PO-TEST-{unique}",
            vendor_id=vendor.id,
            status="billed",
            total=total_amount,
        )
        db.add(po)
        db.flush()

        po_line = PurchaseOrderLine(
            po_id=po.id,
            product_id=product.id,
            account_id=expense_acc.id,
            quantity=1.0,
            unit_price=total_amount,
            subtotal=total_amount,
        )
        db.add(po_line)
        db.flush()

        bill = VendorBill(
            bill_number=f"BILL-TEST-{unique}",
            po_id=po.id,
            vendor_id=vendor.id,
            total=total_amount,
            amount_paid=0.0,
            status="open",
        )
        db.add(bill)
        db.flush()

        bill_line = VendorBillLine(
            bill_id=bill.id,
            product_id=product.id,
            account_id=expense_acc.id,
            quantity=1.0,
            unit_price=total_amount,
            subtotal=total_amount,
        )
        db.add(bill_line)
        db.commit()
        return bill.id


# Verifies full bill settlement via POST /api/v1/vendor-bills/{bill_id}/pay
def test_full_vendor_bill_payment_bank():
    bill_id = _create_test_bill(1000.0)

    with TestClient(app) as client:
        payload = {
            "amount": 1000.0,
            "payment_method": "bank",
            "note": "Full settlement via wire transfer",
        }
        res = client.post(f"/api/v1/vendor-bills/{bill_id}/pay", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()

        assert data["payment_number"].startswith("PAY-")
        assert data["amount"] == 1000.0
        assert data["payment_method"] == "bank"
        assert data["status"] == "posted"
        assert data["journal_entry_id"] is not None

        # Verify bill status updated to 'paid'
        bill_res = client.get(f"/api/v1/vendor-bills/{bill_id}")
        assert bill_res.status_code == 200
        bill_data = bill_res.json()
        assert bill_data["amount_paid"] == 1000.0
        assert bill_data["status"] == "paid"

        # Verify auto-posted double-entry Journal Entry in ledger
        with SessionLocal() as db:
            je = db.scalar(
                select(JournalEntry).where(JournalEntry.id == data["journal_entry_id"])
            )
            assert je is not None
            assert je.total_amount == 1000.0
            assert len(je.items) == 2

            # Debit AP (2010), Credit Bank (1020)
            debit_item = next(it for it in je.items if it.debit > 0)
            credit_item = next(it for it in je.items if it.credit > 0)

            ap_account = db.scalar(select(Account).where(Account.code == "2010"))
            bank_account = db.scalar(select(Account).where(Account.code == "1020"))

            assert debit_item.account_id == ap_account.id
            assert debit_item.debit == 1000.0
            assert credit_item.account_id == bank_account.id
            assert credit_item.credit == 1000.0


# Tests partial payment transitions and subsequent settlement closure
def test_partial_payments_and_lifecycle_transitions():
    bill_id = _create_test_bill(1000.0)

    with TestClient(app) as client:
        # 1. First partial payment: 400.0
        res1 = client.post(
            f"/api/v1/vendor-bills/{bill_id}/pay",
            json={"amount": 400.0, "payment_method": "cash", "note": "Installment 1"},
        )
        assert res1.status_code == 201
        pay1 = res1.json()
        assert pay1["amount"] == 400.0
        assert pay1["payment_method"] == "cash"

        # Check bill state is 'partially_paid'
        bill_res = client.get(f"/api/v1/vendor-bills/{bill_id}")
        assert bill_res.json()["amount_paid"] == 400.0
        assert bill_res.json()["status"] == "partially_paid"

        # 2. Second partial payment: 600.0 (settling remaining balance)
        res2 = client.post(
            f"/api/v1/vendor-bills/{bill_id}/pay",
            json={"amount": 600.0, "payment_method": "bank", "note": "Installment 2"},
        )
        assert res2.status_code == 201
        pay2 = res2.json()
        assert pay2["amount"] == 600.0

        # Check bill state is now 'paid'
        bill_res_final = client.get(f"/api/v1/vendor-bills/{bill_id}")
        assert bill_res_final.json()["amount_paid"] == 1000.0
        assert bill_res_final.json()["status"] == "paid"

        # 3. Fetch all payments linked to this bill
        bill_payments_res = client.get(f"/api/v1/vendor-bills/{bill_id}/payments")
        assert bill_payments_res.status_code == 200
        payments_list = bill_payments_res.json()
        assert len(payments_list) == 2
        # 'set' keyword validates both payment numbers exist without relying on sort order
        payment_nums = {p["payment_number"] for p in payments_list}
        assert pay1["payment_number"] in payment_nums
        assert pay2["payment_number"] in payment_nums


# Tests validation rules: overpayment rejection and fully-paid conflict rejection
def test_payment_validation_and_overpayment_rejection():
    bill_id = _create_test_bill(500.0)

    with TestClient(app) as client:
        # Overpayment: attempt to pay 600 against 500 bill
        overpay_res = client.post(
            f"/api/v1/vendor-bills/{bill_id}/pay",
            json={"amount": 600.0, "payment_method": "bank"},
        )
        assert overpay_res.status_code == 422
        assert "exceeds remaining" in overpay_res.text

        # Pay exactly 500.0
        full_pay_res = client.post(
            f"/api/v1/vendor-bills/{bill_id}/pay",
            json={"amount": 500.0, "payment_method": "bank"},
        )
        assert full_pay_res.status_code == 201

        # Attempt to pay again after bill is already 'paid'
        duplicate_pay_res = client.post(
            f"/api/v1/vendor-bills/{bill_id}/pay",
            json={"amount": 50.0, "payment_method": "bank"},
        )
        assert duplicate_pay_res.status_code == 409
        assert "already fully paid" in duplicate_pay_res.text

        # Zero amount rejected
        zero_res = client.post(
            f"/api/v1/vendor-bills/{bill_id}/pay",
            json={"amount": 0.0, "payment_method": "bank"},
        )
        assert zero_res.status_code == 422

        # Negative amount rejected
        neg_res = client.post(
            f"/api/v1/vendor-bills/{bill_id}/pay",
            json={"amount": -100.0, "payment_method": "bank"},
        )
        assert neg_res.status_code == 422


# Tests the unified /api/v1/payments endpoint for creation, listing, and ID lookup
def test_unified_payments_api_endpoints():
    bill_id = _create_test_bill(750.0)

    with TestClient(app) as client:
        # 1. Create payment through unified endpoint
        create_payload = {
            "payment_type": "outbound",
            "bill_id": bill_id,
            "amount": 750.0,
            "payment_method": "bank",
            "note": "Unified endpoint payment",
        }
        create_res = client.post("/api/v1/payments", json=create_payload)
        assert create_res.status_code == 201, create_res.text
        created_data = create_res.json()
        pay_id = created_data["id"]

        # 2. Get payment by ID
        get_res = client.get(f"/api/v1/payments/{pay_id}")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["id"] == pay_id
        assert get_data["amount"] == 750.0
        assert get_data["bill_id"] == bill_id
        assert get_data["payment_type"] == "outbound"

        # 3. List payments with filters
        list_res = client.get("/api/v1/payments", params={"payment_type": "outbound", "bill_id": bill_id})
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert any(p["id"] == pay_id for p in list_data["data"])

        # 4. 404 for non-existent payment ID
        not_found_res = client.get("/api/v1/payments/999999")
        assert not_found_res.status_code == 404


# Helper creating a complete invoiced Sales Order and Customer Invoice for testing inbound payments
def _create_test_invoice(total_amount: float = 1200.0) -> int:
    with SessionLocal() as db:
        unique = uuid.uuid4().hex[:6]
        customer = Contact(
            name=f"Customer Payer {unique}",
            email=f"customer_{unique}@testpay.com",
            type="customer",
        )
        db.add(customer)
        # 'flush' assigns primary key identifier before downstream foreign key references
        db.flush()

        product = Product(
            name=f"Conference Table {unique}",
            price=total_amount,
            cost=total_amount * 0.6,
            product_type="goods",
        )
        db.add(product)
        db.flush()

        income_acc = db.scalar(select(Account).where(Account.code == "4010"))

        so = SalesOrder(
            so_number=f"SO-TEST-{unique}",
            customer_id=customer.id,
            status="invoiced",
            total=total_amount,
        )
        db.add(so)
        db.flush()

        so_line = SalesOrderLine(
            so_id=so.id,
            product_id=product.id,
            account_id=income_acc.id,
            quantity=1.0,
            unit_price=total_amount,
            subtotal=total_amount,
        )
        db.add(so_line)
        db.flush()

        invoice = CustomerInvoice(
            invoice_number=f"INV-TEST-{unique}",
            so_id=so.id,
            customer_id=customer.id,
            total=total_amount,
            amount_paid=0.0,
            status="open",
        )
        db.add(invoice)
        db.flush()

        inv_line = CustomerInvoiceLine(
            invoice_id=invoice.id,
            product_id=product.id,
            account_id=income_acc.id,
            quantity=1.0,
            unit_price=total_amount,
            subtotal=total_amount,
        )
        db.add(inv_line)
        db.commit()
        return invoice.id


# Verifies full customer invoice settlement via POST /api/v1/customer-invoices/{invoice_id}/pay
def test_full_customer_invoice_payment_bank():
    invoice_id = _create_test_invoice(1200.0)

    with TestClient(app) as client:
        payload = {
            "amount": 1200.0,
            "payment_method": "bank",
            "note": "Full customer receipt via wire transfer",
        }
        res = client.post(f"/api/v1/customer-invoices/{invoice_id}/pay", json=payload)
        assert res.status_code == 201, res.text
        data = res.json()

        assert data["payment_number"].startswith("PAY-")
        assert data["amount"] == 1200.0
        assert data["payment_method"] == "bank"
        assert data["payment_type"] == "inbound"
        assert data["status"] == "posted"
        assert data["invoice_id"] == invoice_id
        assert data["invoice_number"].startswith("INV-TEST-")
        assert data["journal_entry_id"] is not None

        # Verify customer invoice status transitioned to 'paid'
        inv_res = client.get(f"/api/v1/customer-invoices/{invoice_id}")
        assert inv_res.status_code == 200
        inv_data = inv_res.json()
        assert inv_data["amount_paid"] == 1200.0
        assert inv_data["status"] == "paid"

        # Verify auto-posted double-entry Journal Entry in general ledger
        with SessionLocal() as db:
            je = db.scalar(
                select(JournalEntry).where(JournalEntry.id == data["journal_entry_id"])
            )
            assert je is not None
            assert je.total_amount == 1200.0
            assert len(je.items) == 2

            # Debit Bank (1020), Credit Debtors (1030)
            debit_item = next(it for it in je.items if it.debit > 0)
            credit_item = next(it for it in je.items if it.credit > 0)

            bank_account = db.scalar(select(Account).where(Account.code == "1020"))
            ar_account = db.scalar(select(Account).where(Account.code == "1030"))

            assert debit_item.account_id == bank_account.id
            assert debit_item.debit == 1200.0
            assert credit_item.account_id == ar_account.id
            assert credit_item.credit == 1200.0


# Tests partial payments against customer invoices and resulting lifecycle transitions
def test_partial_customer_payments_and_lifecycle():
    invoice_id = _create_test_invoice(1500.0)

    with TestClient(app) as client:
        # 1. First partial collection: 500.0 cash
        res1 = client.post(
            f"/api/v1/customer-invoices/{invoice_id}/pay",
            json={"amount": 500.0, "payment_method": "cash", "note": "Installment 1 in cash"},
        )
        assert res1.status_code == 201
        pay1 = res1.json()
        assert pay1["amount"] == 500.0
        assert pay1["payment_method"] == "cash"
        assert pay1["payment_type"] == "inbound"

        # Check invoice state is 'partially_paid'
        inv_res1 = client.get(f"/api/v1/customer-invoices/{invoice_id}")
        assert inv_res1.json()["amount_paid"] == 500.0
        assert inv_res1.json()["status"] == "partially_paid"

        # 2. Second partial collection: 1000.0 bank (settling remaining balance)
        res2 = client.post(
            f"/api/v1/customer-invoices/{invoice_id}/pay",
            json={"amount": 1000.0, "payment_method": "bank", "note": "Installment 2 via bank"},
        )
        assert res2.status_code == 201
        pay2 = res2.json()
        assert pay2["amount"] == 1000.0
        assert pay2["payment_type"] == "inbound"

        # Check invoice state is now fully 'paid'
        inv_res_final = client.get(f"/api/v1/customer-invoices/{invoice_id}")
        assert inv_res_final.json()["amount_paid"] == 1500.0
        assert inv_res_final.json()["status"] == "paid"

        # 3. Query all payments linked to this customer invoice
        inv_payments_res = client.get(f"/api/v1/customer-invoices/{invoice_id}/payments")
        assert inv_payments_res.status_code == 200
        payments_list = inv_payments_res.json()
        assert len(payments_list) == 2
        payment_nums = {p["payment_number"] for p in payments_list}
        assert pay1["payment_number"] in payment_nums
        assert pay2["payment_number"] in payment_nums


# Tests validation rules: overpayment rejection and fully-paid invoice conflict rejection
def test_customer_payment_validations():
    invoice_id = _create_test_invoice(600.0)

    with TestClient(app) as client:
        # Overpayment: attempt to collect 700 against 600 invoice
        overpay_res = client.post(
            f"/api/v1/customer-invoices/{invoice_id}/pay",
            json={"amount": 700.0, "payment_method": "bank"},
        )
        assert overpay_res.status_code == 422
        assert "exceeds remaining" in overpay_res.text

        # Pay exactly 600.0
        full_pay_res = client.post(
            f"/api/v1/customer-invoices/{invoice_id}/pay",
            json={"amount": 600.0, "payment_method": "bank"},
        )
        assert full_pay_res.status_code == 201

        # Attempt to pay again after invoice is already 'paid'
        duplicate_pay_res = client.post(
            f"/api/v1/customer-invoices/{invoice_id}/pay",
            json={"amount": 50.0, "payment_method": "bank"},
        )
        assert duplicate_pay_res.status_code == 409
        assert "already fully paid" in duplicate_pay_res.text

        # Zero amount rejected
        zero_res = client.post(
            f"/api/v1/customer-invoices/{invoice_id}/pay",
            json={"amount": 0.0, "payment_method": "bank"},
        )
        assert zero_res.status_code == 422

        # Negative amount rejected
        neg_res = client.post(
            f"/api/v1/customer-invoices/{invoice_id}/pay",
            json={"amount": -50.0, "payment_method": "bank"},
        )
        assert neg_res.status_code == 422


# Tests unified /api/v1/payments endpoint for inbound customer receipts
def test_unified_payments_api_inbound_endpoints():
    invoice_id = _create_test_invoice(850.0)

    with TestClient(app) as client:
        # 1. Reject inbound payment without invoice_id
        bad_res = client.post(
            "/api/v1/payments",
            json={
                "payment_type": "inbound",
                "amount": 850.0,
                "payment_method": "bank",
            },
        )
        assert bad_res.status_code == 422
        assert "invoice_id is required" in bad_res.text

        # 2. Create inbound payment through unified endpoint
        create_payload = {
            "payment_type": "inbound",
            "invoice_id": invoice_id,
            "amount": 850.0,
            "payment_method": "bank",
            "note": "Unified endpoint inbound receipt",
        }
        create_res = client.post("/api/v1/payments", json=create_payload)
        assert create_res.status_code == 201, create_res.text
        created_data = create_res.json()
        pay_id = created_data["id"]

        # Verify response attributes
        assert created_data["id"] == pay_id
        assert created_data["payment_type"] == "inbound"
        assert created_data["invoice_id"] == invoice_id
        assert created_data["amount"] == 850.0

        # 3. Get payment by ID
        get_res = client.get(f"/api/v1/payments/{pay_id}")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["id"] == pay_id
        assert get_data["payment_type"] == "inbound"
        assert get_data["invoice_id"] == invoice_id

        # 4. List payments filtered by invoice_id
        list_res = client.get(
            "/api/v1/payments",
            params={"payment_type": "inbound", "invoice_id": invoice_id},
        )
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert any(p["id"] == pay_id for p in list_data["data"])
