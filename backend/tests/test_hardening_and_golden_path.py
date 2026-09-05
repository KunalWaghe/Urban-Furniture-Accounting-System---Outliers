"""
Phase 7 Hardening and Golden-Path End-to-End Test Suite.

Validates:
1. RBAC authorization barriers on all transaction routers (PO, SO, Bills, Invoices, Payments).
2. Date chronological validations (due_date >= bill_date, period_end > period_start).
3. Service mutation rollback handling on simulated database/validation failures.
4. Complete Golden-Path transaction cycle with double-entry balance sheet equilibrium audit.
"""

from datetime import datetime, timezone, timedelta
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password, create_access_token
from app.core.exceptions import ValidationException
from app.models.user import User
from app.models.contact import Contact
from app.models.product import Product
from app.models.account import Account
from app.models.journal import Journal
from app.models.analytic_account import AnalyticAccount
from app.models.budget import Budget
from app.services.accounting_service import seed_accounting_defaults
from app.services.vendor_bill_service import validate_bill_dates
from app.services.customer_invoice_service import validate_invoice_dates
from app.services.budget_service import create_budget
from app.schemas.budget import BudgetCreate
from app.schemas.purchase_order import POCreate, POLineCreate
from app.schemas.sales_order import SOCreate, SOLineCreate
from app.services.purchase_order_service import create_purchase_order, confirm_purchase_order
from app.services.sales_order_service import create_sales_order, confirm_sales_order
from app.services.vendor_bill_service import create_bill_from_po
from app.services.customer_invoice_service import create_invoice_from_so
from app.services.payment_service import create_outbound_payment, create_inbound_payment
from app.services.report_service import get_balance_sheet


# Fixture ensuring clean schema synchronization and accounting defaults before test runs
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_accounting_defaults(db)
    # 'yield' yields control during test execution and continues for teardown
    yield


# Helper creating JWT access bearer token for specified role
def _create_token_for_role(role: str, user_id: int = 8888) -> str:
    """
    Generates a signed JWT bearer token containing role and identity claims,
    and guarantees the user entity is persisted in the database session.
    """
    login_id = f"u{role[:4]}{user_id % 1000:03d}"
    email = f"{role}_{user_id}@urbanfurniture.com"
    with SessionLocal() as db:
        user = db.query(User).filter(User.login_id == login_id).first()
        if not user:
            user = User(
                id=user_id,
                login_id=login_id,
                email=email,
                name=f"Test {role.title()}",
                role=role,
                password_hash=hash_password("SecureP@ss123!"),
                is_active=True,
            )
            db.add(user)
            db.commit()
    return create_access_token({
        "sub": login_id,
        "id": user_id,
        "login_id": login_id,
        "email": email,
        "role": role,
        "name": f"Test {role.title()}",
    })


# Helper creating a persistent customer contact and active product entity
def _setup_master_data():
    with SessionLocal() as db:
        unique_id = uuid.uuid4().hex[:6]
        vendor = Contact(
            name=f"Vendor {unique_id}",
            type="vendor",
            email=f"v_{unique_id}@vendorcorp.com",
        )
        customer = Contact(
            name=f"Customer {unique_id}",
            type="customer",
            email=f"c_{unique_id}@clientcorp.com",
        )
        product = Product(
            name=f"Ergonomic Task Desk {unique_id}",
            price=20000.0,
            cost=12000.0,
            product_type="goods",
            tax_percent=18.0,
        )
        db.add_all([vendor, customer, product])
        # 'commit' writes entities and generates their primary keys
        db.commit()
        return vendor.id, customer.id, product.id


# Tests RBAC authorization enforcement across transaction endpoints (PO, SO, Bills, Invoices, Payments)
def test_rbac_transaction_routers_authorization_barriers():
    """
    Verifies that unauthenticated or unauthorized roles ('contact') cannot access
    transaction routers, while 'invoicing_user' and 'admin' are granted access.
    """
    with TestClient(app) as client:
        # 1. Unauthenticated requests to transaction routers must return 401 Unauthorized
        routes_to_test = [
            ("GET", "/api/v1/purchase-orders"),
            ("GET", "/api/v1/vendor-bills"),
            ("GET", "/api/v1/sales-orders"),
            ("GET", "/api/v1/customer-invoices"),
            ("GET", "/api/v1/payments"),
            ("GET", "/api/v1/journal-entries"),
        ]

        for method, endpoint in routes_to_test:
            res_anon = client.request(method, endpoint)
            # 'status_code' checks HTTP response code for authentication challenge
            assert res_anon.status_code == 401, f"{endpoint} should require authentication"

        # 2. Portal user with role 'contact' must receive 403 Forbidden on transaction routers
        contact_token = _create_token_for_role("contact", user_id=701)
        headers_contact = {"Authorization": f"Bearer {contact_token}"}

        for method, endpoint in routes_to_test:
            res_contact = client.request(method, endpoint, headers=headers_contact)
            assert res_contact.status_code == 403, f"{endpoint} should forbid contact role"
            assert "not authorized" in res_contact.json()["error"]["message"].lower()

        # 3. Accountant ('invoicing_user') must receive 200 OK
        accountant_token = _create_token_for_role("invoicing_user", user_id=702)
        headers_accountant = {"Authorization": f"Bearer {accountant_token}"}

        for method, endpoint in routes_to_test:
            res_acc = client.request(method, endpoint, headers=headers_accountant)
            assert res_acc.status_code == 200, f"{endpoint} should allow invoicing_user"


# Tests date chronology validations (due_date >= bill_date, period_end > period_start)
def test_date_chronology_validations():
    """
    Tests cross-field chronological validation guards on bills, invoices, and budgets.
    """
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
    tomorrow = now + timedelta(days=1)

    # 1. Vendor bill date validation
    with pytest.raises(ValidationException) as exc_bill:
        # Passing due_date earlier than bill_date must raise ValidationException
        validate_bill_dates(bill_date=now, due_date=yesterday)
    assert "due_date cannot be earlier than bill_date" in str(exc_bill.value)

    # 2. Customer invoice date validation
    with pytest.raises(ValidationException) as exc_inv:
        # Passing due_date earlier than invoice_date must raise ValidationException
        validate_invoice_dates(invoice_date=now, due_date=yesterday)
    assert "due_date cannot be earlier than invoice_date" in str(exc_inv.value)

    # Valid dates should pass cleanly without exception
    validate_bill_dates(bill_date=now, due_date=tomorrow)
    validate_invoice_dates(invoice_date=now, due_date=tomorrow)

    # 3. Budget period end must be chronologically after period start
    with SessionLocal() as db:
        unique_suffix = uuid.uuid4().hex[:4]
        analytic = AnalyticAccount(
            code=f"ANL-DATE-{unique_suffix}",
            name="Date Test Centre",
            type="expense",
        )
        db.add(analytic)
        db.commit()

        # Attempt to create budget where period_end == period_start
        with pytest.raises(ValueError) as exc_budget:
            BudgetCreate(
                name="Invalid Timing Budget",
                analytic_account_id=analytic.id,
                period_start=now,
                period_end=now,
                committed_amount=50000.0,
            )
        assert "period_end must be chronologically after period_start" in str(exc_budget.value)


# Tests database rollback behavior during multi-step service failures
def test_service_mutation_rollback_on_failure():
    """
    Verifies that a failure during a transaction prevents partial data writes
    and leaves the database session clean without corrupt state.
    """
    vendor_id, _, product_id = _setup_master_data()

    with SessionLocal() as db:
        # 1. Create and confirm PO
        po_in = POCreate(
            vendor_id=vendor_id,
            lines=[POLineCreate(product_id=product_id, quantity=2.0, unit_price=10000.0)],
        )
        po = create_purchase_order(db, po_in)
        confirm_purchase_order(db, po.id)

        # 2. Bill the PO
        bill_resp = create_bill_from_po(db, po.id)
        bill_id = bill_resp.bill.id

        # 3. Attempt to record an overpayment payment (which raises ValidationException)
        with pytest.raises(ValidationException) as exc_info:
            create_outbound_payment(
                db=db,
                bill_id=bill_id,
                amount=999999.0,  # exceeds bill total
                payment_method="bank",
            )
        assert "exceeds remaining bill balance" in str(exc_info.value)

        # 4. Verify that the bill status is still 'open' and amount_paid is still 0.0
        from app.models.vendor_bill import VendorBill
        refreshed_bill = db.get(VendorBill, bill_id)
        assert refreshed_bill.status == "open"
        assert refreshed_bill.amount_paid == 0.0


# Tests the full end-to-end golden path accounting cycle and asserts double-entry equilibrium
def test_full_golden_path_cycle_and_balance_sheet_equilibrium():
    """
    Simulates complete business cycle:
    1. PO -> Confirm -> Vendor Bill -> Bank Pay
    2. SO -> Confirm -> Customer Invoice -> Bank Collect
    3. Verifies Balance Sheet equilibrium: Assets == Liabilities + Capital
    """
    vendor_id, customer_id, product_id = _setup_master_data()

    with SessionLocal() as db:
        # --- Procurement Vertical Cycle ---
        # 1. Create & confirm Purchase Order
        po_in = POCreate(
            vendor_id=vendor_id,
            lines=[POLineCreate(product_id=product_id, quantity=3.0, unit_price=12000.0)], # 36,000
        )
        po = create_purchase_order(db, po_in)
        confirm_purchase_order(db, po.id)

        # 2. Generate Vendor Bill
        bill_resp = create_bill_from_po(db, po.id)
        bill_id = bill_resp.bill.id

        # 3. Outbound Payment (Pay half of the bill)
        pay_out = create_outbound_payment(
            db=db,
            bill_id=bill_id,
            amount=18000.0,
            payment_method="bank",
            note="Partial payment for procurement cycle",
        )
        assert pay_out.status == "posted"

        # --- Sales Vertical Cycle ---
        # 4. Create & confirm Sales Order
        so_in = SOCreate(
            customer_id=customer_id,
            lines=[SOLineCreate(product_id=product_id, quantity=2.0, unit_price=20000.0)], # 40,000
        )
        so = create_sales_order(db, so_in)
        confirm_sales_order(db, so.id)

        # 5. Generate Customer Invoice
        inv_resp = create_invoice_from_so(db, so.id)
        inv_id = inv_resp.invoice.id

        # 6. Inbound Payment (Collect full customer invoice)
        pay_in = create_inbound_payment(
            db=db,
            invoice_id=inv_id,
            amount=40000.0,
            payment_method="bank",
            note="Full settlement for client sales cycle",
        )
        assert pay_in.status == "posted"

        # --- Double-Entry Ledger Equilibrium Audit ---
        bs = get_balance_sheet(db)
        # 'is_balanced' asserts Assets == Liabilities + Capital
        assert bs.is_balanced is True
        assert bs.assets.total == bs.total_liabilities_and_capital
        assert bs.assets.total > 0
