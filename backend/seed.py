"""
Deterministic Demo Seed Script for Urban Furniture Accounting System.
Includes complete demo dataset for Procurement & Vendor Bills (P0-BE-06).

Run via:
    python seed.py
    or: .\.venv\Scripts\python seed.py
"""

from datetime import datetime, timezone
from sqlalchemy import text, func
from app.core.database import SessionLocal, engine, Base
from app.models import (
    Contact,
    Product,
    User,
    PurchaseOrder,
    PurchaseOrderLine,
    VendorBill,
    SalesOrder,
    CustomerInvoice,
    Payment,
    JournalEntry,
    JournalItem,
    Account,
    Journal,
    AnalyticAccount,
    Budget,
    VendorBillLine,
    CustomerInvoiceLine,
)
from app.services.accounting_service import seed_accounting_defaults
from app.services.purchase_order_service import create_purchase_order, confirm_purchase_order
from app.services.vendor_bill_service import create_bill_from_po
from app.services.sales_order_service import create_sales_order, confirm_sales_order
from app.services.customer_invoice_service import create_invoice_from_so
from app.services import payment_service
from app.services import report_service
from app.services import budget_service
from app.schemas.purchase_order import POCreate, POLineCreate
from app.schemas.sales_order import SOCreate, SOLineCreate
from app.schemas.budget import BudgetCreate
from app.core.security import hash_password
from app.services import auth_service


def seed_users(db):
    """
    Seed demo admin and accountant accounts.

    Canonical demo credentials (same list used on backend startup):
    - login_id: admin      | password: Admin@123      | role: admin
    - login_id: admin001   | password: Admin@123      | role: admin
    - login_id: accountant | password: Accountant@123 | role: invoicing_user
    """
    print("\n--- Seeding demo login accounts ---")
    auth_service.ensure_demo_users(db)


def seed_contacts_and_products(db):
    """Seed customer and vendor contacts, plus product catalog."""
    contacts_data = [
        # Customers
        {
            "name": "Acme Corp",
            "type": "customer",
            "email": "procurement@acme.com",
            "mobile": "+91 98765 43210",
            "city": "Navi Mumbai",
            "state": "Maharashtra",
            "pincode": "400703",
            "is_active": True,
        },
        {
            "name": "Nimesh Pathak",
            "type": "customer",
            "email": "nimesh@pathakdesigns.in",
            "mobile": "+91 98201 23456",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400050",
            "is_active": True,
        },
        {
            "name": "Deco Spaces Interiors",
            "type": "customer",
            "email": "contact@decospaces.com",
            "mobile": "+91 98112 34567",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411001",
            "is_active": True,
        },
        {
            "name": "Urban Living Studio",
            "type": "customer",
            "email": "projects@urbanliving.in",
            "mobile": "+91 98450 12345",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
            "is_active": True,
        },
        # Vendors for Procurement (P0-BE-05, P0-BE-06)
        {
            "name": "Azure Furniture Supplies",
            "type": "vendor",
            "email": "accounts@azurefurniture.com",
            "mobile": "+91 98800 54321",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034",
            "is_active": True,
        },
        {
            "name": "Timber Supplies Ltd",
            "type": "vendor",
            "email": "sales@timbersupplies.com",
            "mobile": "+91 98451 98765",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560078",
            "is_active": True,
        },
        {
            "name": "Durian Veneers & Woods",
            "type": "vendor",
            "email": "supply@durianveneers.com",
            "mobile": "+91 98250 87654",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pincode": "380001",
            "is_active": True,
        },
        {
            "name": "SteelCraft Fittings",
            "type": "vendor",
            "email": "sales@steelcraft.in",
            "mobile": "+91 98240 11223",
            "city": "Rajkot",
            "state": "Gujarat",
            "pincode": "360002",
            "is_active": True,
        },
    ]

    for cd in contacts_data:
        contact = db.query(Contact).filter(Contact.name == cd["name"]).first()
        if not contact:
            db.add(Contact(**cd))
        else:
            contact.is_active = True
            for k, v in cd.items():
                setattr(contact, k, v)

    products_data = [
        {
            "name": "Executive Ergonomic Chair",
            "product_type": "goods",
            "category": "Office Furniture",
            "price": 14500.0,
            "cost": 9200.0,
            "tax_percent": 18.0,
            "description": "High-back ergonomic mesh office chair with lumbar support",
            "is_active": True,
        },
        {
            "name": "Solid Teak Wood Dining Table",
            "product_type": "goods",
            "category": "Dining Furniture",
            "price": 38000.0,
            "cost": 24500.0,
            "tax_percent": 18.0,
            "description": "Handcrafted solid teak 6-seater dining table",
            "is_active": True,
        },
        {
            "name": "Modular Office Workstation Desk",
            "product_type": "goods",
            "category": "Office Furniture",
            "price": 22500.0,
            "cost": 14000.0,
            "tax_percent": 18.0,
            "description": "Dual workstation desk with cable management",
            "is_active": True,
        },
        {
            "name": "Wooden Chair - Minimalist Oak",
            "product_type": "goods",
            "category": "Seating",
            "price": 6800.0,
            "cost": 4100.0,
            "tax_percent": 12.0,
            "description": "Minimalist natural oak wood dining chair",
            "is_active": True,
        },
        {
            "name": "Fabric Accent Lounge Armchair",
            "product_type": "goods",
            "category": "Living Furniture",
            "price": 19200.0,
            "cost": 12000.0,
            "tax_percent": 18.0,
            "description": "Velvet upholstery lounge chair with brass legs",
            "is_active": True,
        },
    ]

    for pd in products_data:
        product = db.query(Product).filter(Product.name == pd["name"]).first()
        if not product:
            db.add(Product(**pd))
        else:
            product.is_active = True
            for k, v in pd.items():
                setattr(product, k, v)

    db.commit()


def seed_p0_be_06_data(db):
    """
    Seed deterministic dummy data specifically for P0-BE-06:
    1. Billed POs with auto-generated Vendor Bills & double-entry Journal Entries (Debit 5010 / Credit 2010)
    2. Confirmed POs ready for manual or UI testing of 'Auto-Generate Vendor Bill'
    3. Draft POs ready for draft -> confirm -> bill workflow testing
    """
    # Look up vendors
    timber_vendor = db.query(Contact).filter(Contact.name == "Timber Supplies Ltd").first()
    steel_vendor = db.query(Contact).filter(Contact.name == "SteelCraft Fittings").first()
    durian_vendor = db.query(Contact).filter(Contact.name == "Durian Veneers & Woods").first()
    azure_vendor = db.query(Contact).filter(Contact.name == "Azure Furniture Supplies").first()

    # Look up products
    chair_ergo = db.query(Product).filter(Product.name == "Executive Ergonomic Chair").first()
    table_teak = db.query(Product).filter(Product.name == "Solid Teak Wood Dining Table").first()
    desk_work = db.query(Product).filter(Product.name == "Modular Office Workstation Desk").first()
    chair_oak = db.query(Product).filter(Product.name == "Wooden Chair - Minimalist Oak").first()
    armchair_velvet = db.query(Product).filter(Product.name == "Fabric Accent Lounge Armchair").first()

    if not all([timber_vendor, steel_vendor, durian_vendor, azure_vendor, chair_ergo, table_teak, desk_work, chair_oak, armchair_velvet]):
        print("[WARNING] Missing master vendors or products. Skipping PO/Vendor Bill seeding.")
        return

    # Check if we already have seeded bills for these main vendors
    existing_vendor_bills = (
        db.query(VendorBill)
        .filter(VendorBill.vendor_id.in_([timber_vendor.id, steel_vendor.id, durian_vendor.id]))
        .count()
    )

    if existing_vendor_bills >= 3:
        print(f"[INFO] P0-BE-06 dummy data already exists ({existing_vendor_bills} vendor bills found). Skipping re-creation.")
        return

    print("\n--- Seeding P0-BE-06 Procurement & Vendor Bill dummy data ---")

    # --- 1. BILLED POs WITH VENDOR BILLS & POSTED JOURNAL ENTRIES ---
    billed_scenarios = [
        {
            "vendor_id": timber_vendor.id,
            "vendor_name": timber_vendor.name,
            "lines": [
                {"product_id": table_teak.id, "quantity": 4.0, "unit_price": table_teak.cost},   # 4 * 24500 = 98000
                {"product_id": chair_oak.id, "quantity": 10.0, "unit_price": chair_oak.cost},    # 10 * 4100 = 41000
            ],
            "note": "Timber & Oak woodwork shipment",
        },
        {
            "vendor_id": steel_vendor.id,
            "vendor_name": steel_vendor.name,
            "lines": [
                {"product_id": chair_ergo.id, "quantity": 8.0, "unit_price": chair_ergo.cost},   # 8 * 9200 = 73600
                {"product_id": desk_work.id, "quantity": 3.0, "unit_price": desk_work.cost},     # 3 * 14000 = 42000
            ],
            "note": "Office workstations and ergonomic frames",
        },
        {
            "vendor_id": durian_vendor.id,
            "vendor_name": durian_vendor.name,
            "lines": [
                {"product_id": armchair_velvet.id, "quantity": 5.0, "unit_price": armchair_velvet.cost},  # 5 * 12000 = 60000
            ],
            "note": "Velvet lounge armchairs and veneers",
        },
    ]

    for sc in billed_scenarios:
        po_in = POCreate(
            vendor_id=sc["vendor_id"],
            order_date=datetime.now(timezone.utc),
            lines=[POLineCreate(**ln) for ln in sc["lines"]],
        )
        po_resp = create_purchase_order(db, po_in)
        confirm_purchase_order(db, po_resp.id)
        bill_resp = create_bill_from_po(db, po_resp.id)
        print(f"  [BILLED] PO {po_resp.po_number} -> Bill {bill_resp.bill.bill_number} (INR {bill_resp.bill.total:,.2f}) -> JE {bill_resp.journal_entry.entry_number} [{sc['vendor_name']}]")

    # --- 2. CONFIRMED POs (Ready for manual test of POST /create-bill) ---
    confirmed_scenarios = [
        {
            "vendor_id": azure_vendor.id,
            "vendor_name": azure_vendor.name,
            "lines": [
                {"product_id": table_teak.id, "quantity": 2.0, "unit_price": table_teak.cost},   # 2 * 24500 = 49000
                {"product_id": chair_ergo.id, "quantity": 4.0, "unit_price": chair_ergo.cost},   # 4 * 9200 = 36800
            ],
        },
        {
            "vendor_id": timber_vendor.id,
            "vendor_name": timber_vendor.name,
            "lines": [
                {"product_id": chair_oak.id, "quantity": 15.0, "unit_price": chair_oak.cost},    # 15 * 4100 = 61500
            ],
        },
    ]

    for sc in confirmed_scenarios:
        po_in = POCreate(
            vendor_id=sc["vendor_id"],
            order_date=datetime.now(timezone.utc),
            lines=[POLineCreate(**ln) for ln in sc["lines"]],
        )
        po_resp = create_purchase_order(db, po_in)
        confirm_purchase_order(db, po_resp.id)
        print(f"  [CONFIRMED] PO {po_resp.po_number} (INR {po_resp.total:,.2f}) - Ready for /create-bill [{sc['vendor_name']}]")

    # --- 3. DRAFT POs (Ready for full lifecycle testing) ---
    draft_scenarios = [
        {
            "vendor_id": steel_vendor.id,
            "vendor_name": steel_vendor.name,
            "lines": [
                {"product_id": desk_work.id, "quantity": 5.0, "unit_price": desk_work.cost},     # 5 * 14000 = 70000
            ],
        },
        {
            "vendor_id": durian_vendor.id,
            "vendor_name": durian_vendor.name,
            "lines": [
                {"product_id": armchair_velvet.id, "quantity": 2.0, "unit_price": armchair_velvet.cost},  # 2 * 12000 = 24000
            ],
        },
    ]

    for sc in draft_scenarios:
        po_in = POCreate(
            vendor_id=sc["vendor_id"],
            order_date=datetime.now(timezone.utc),
            lines=[POLineCreate(**ln) for ln in sc["lines"]],
        )
        po_resp = create_purchase_order(db, po_in)
        print(f"  [DRAFT] PO {po_resp.po_number} (INR {po_resp.total:,.2f}) - Ready to confirm [{sc['vendor_name']}]")


def seed_phase3_sales_data(db):
    """
    Seed deterministic dummy data for Sales Orders & Customer Invoices (Phase 3):
    1. Invoiced SOs with Customer Invoices & posted double-entry Journal Entries (Debit 1030 Debtors / Credit 4010 Sales Income)
    2. Confirmed SOs ready for testing /create-invoice
    3. Draft SOs ready for draft -> confirm -> invoice workflow
    """
    acme_cust = db.query(Contact).filter(Contact.name == "Acme Corp").first()
    nimesh_cust = db.query(Contact).filter(Contact.name == "Nimesh Pathak").first()
    deco_cust = db.query(Contact).filter(Contact.name == "Deco Spaces Interiors").first()

    chair_ergo = db.query(Product).filter(Product.name == "Executive Ergonomic Chair").first()
    table_teak = db.query(Product).filter(Product.name == "Solid Teak Wood Dining Table").first()
    desk_work = db.query(Product).filter(Product.name == "Modular Office Workstation Desk").first()

    if not all([acme_cust, nimesh_cust, deco_cust, chair_ergo, table_teak, desk_work]):
        print("[WARNING] Missing master customers or products. Skipping Sales/Invoice seeding.")
        return

    existing_invoices = db.query(CustomerInvoice).count()
    if existing_invoices >= 2:
        print(f"[INFO] Phase 3 sales dummy data already exists ({existing_invoices} customer invoices found). Skipping.")
        return

    print("\n--- Seeding Phase 3 Sales Orders & Customer Invoices ---")

    # 1. Invoiced SOs with Customer Invoices & SLS Journal Entries
    invoiced_scenarios = [
        {
            "customer_id": acme_cust.id,
            "customer_name": acme_cust.name,
            "lines": [
                {"product_id": desk_work.id, "quantity": 4.0, "unit_price": desk_work.price},   # 4 * 22500 = 90000
                {"product_id": chair_ergo.id, "quantity": 4.0, "unit_price": chair_ergo.price}, # 4 * 14500 = 58000
            ],
        },
        {
            "customer_id": nimesh_cust.id,
            "customer_name": nimesh_cust.name,
            "lines": [
                {"product_id": table_teak.id, "quantity": 1.0, "unit_price": table_teak.price}, # 1 * 38000 = 38000
            ],
        },
    ]

    for sc in invoiced_scenarios:
        so_in = SOCreate(
            customer_id=sc["customer_id"],
            order_date=datetime.now(timezone.utc),
            lines=[SOLineCreate(**ln) for ln in sc["lines"]],
        )
        so_resp = create_sales_order(db, so_in)
        confirm_sales_order(db, so_resp.id)
        inv_resp = create_invoice_from_so(db, so_resp.id)
        print(f"  [INVOICED] SO {so_resp.so_number} -> Invoice {inv_resp.invoice.invoice_number} (INR {inv_resp.invoice.total:,.2f}) -> JE {inv_resp.journal_entry.entry_number} [{sc['customer_name']}]")

    # 2. Confirmed SOs (Ready for manual test of /create-invoice)
    confirmed_scenarios = [
        {
            "customer_id": deco_cust.id,
            "customer_name": deco_cust.name,
            "lines": [
                {"product_id": chair_ergo.id, "quantity": 6.0, "unit_price": chair_ergo.price}, # 6 * 14500 = 87000
            ],
        },
    ]

    for sc in confirmed_scenarios:
        so_in = SOCreate(
            customer_id=sc["customer_id"],
            order_date=datetime.now(timezone.utc),
            lines=[SOLineCreate(**ln) for ln in sc["lines"]],
        )
        so_resp = create_sales_order(db, so_in)
        confirm_sales_order(db, so_resp.id)
        print(f"  [CONFIRMED] SO {so_resp.so_number} (INR {so_resp.total:,.2f}) - Ready for /create-invoice [{sc['customer_name']}]")

    # 3. Draft SOs (Ready for lifecycle test)
    draft_scenarios = [
        {
            "customer_id": acme_cust.id,
            "customer_name": acme_cust.name,
            "lines": [
                {"product_id": desk_work.id, "quantity": 2.0, "unit_price": desk_work.price},   # 2 * 22500 = 45000
            ],
        },
    ]

    for sc in draft_scenarios:
        so_in = SOCreate(
            customer_id=sc["customer_id"],
            order_date=datetime.now(timezone.utc),
            lines=[SOLineCreate(**ln) for ln in sc["lines"]],
        )
        so_resp = create_sales_order(db, so_in)
        print(f"  [DRAFT] SO {so_resp.so_number} (INR {so_resp.total:,.2f}) - Ready to confirm [{sc['customer_name']}]")


# Seeds financial settlement payments for bills and customer invoices
def seed_phase4_payment_data(db):
    """
    Seed deterministic dummy payment records for Phase 2 & Phase 4:
    1. Outbound vendor bill settlement (Dr 2010 Creditors / Cr 1020 Bank)
    2. Inbound customer invoice settlement (Dr 1020 Bank / Cr 1030 Debtors)
    """
    existing_payments = db.query(Payment).count()
    if existing_payments >= 2:
        print(f"[INFO] Financial payments dummy data already exists ({existing_payments} payments found). Skipping.")
        return

    print("\n--- Seeding Financial Payments (Inbound & Outbound) ---")

    # 1. Settle one open vendor bill (Outbound)
    open_bill = db.query(VendorBill).filter(VendorBill.status == "open").first()
    if open_bill:
        pay_bill_resp = payment_service.create_outbound_payment(
            db=db,
            bill_id=open_bill.id,
            amount=open_bill.total,
            payment_method="bank",
            note="Full vendor settlement seeded via wire transfer",
        )
        print(f"  [PAID BILL] Bill {open_bill.bill_number} -> Payment {pay_bill_resp.payment_number} (INR {pay_bill_resp.amount:,.2f}) -> JE {pay_bill_resp.journal_entry_number}")

    # 2. Settle one open customer invoice (Inbound)
    open_invoice = db.query(CustomerInvoice).filter(CustomerInvoice.status == "open").first()
    if open_invoice:
        pay_inv_resp = payment_service.create_inbound_payment(
            db=db,
            invoice_id=open_invoice.id,
            amount=open_invoice.total,
            payment_method="bank",
            note="Full customer invoice collection seeded via wire transfer",
        )
        print(f"  [PAID INVOICE] Invoice {open_invoice.invoice_number} -> Payment {pay_inv_resp.payment_number} (INR {pay_inv_resp.amount:,.2f}) -> JE {pay_inv_resp.journal_entry_number}")


# Computes and displays financial health verification via Profit & Loss and Balance Sheet
def verify_phase5_reports(db):
    """
    Generate and display Phase 5 accounting reports to verify system consistency:
    - Profit and Loss: Revenue, Expenses, Net Income
    - Balance Sheet: Assets, Liabilities, Capital, and double-entry equilibrium confirmation
    """
    print("\n--- Verifying Phase 5 Financial Reports (P&L and Balance Sheet) ---")

    # Generate current year / all-time Profit and Loss statement
    pl = report_service.get_profit_loss(db)
    print(f"  [P&L] Total Income:   INR {pl.income.total:,.2f}")
    print(f"  [P&L] Total Expenses: INR {pl.expenses.total:,.2f}")
    print(f"  [P&L] Net Income:     INR {pl.net_income:,.2f}")

    # Generate Balance Sheet snapshot
    bs = report_service.get_balance_sheet(db)
    print(f"  [BALANCE SHEET] Total Assets:                   INR {bs.assets.total:,.2f}")
    print(f"  [BALANCE SHEET] Total Liabilities:              INR {bs.liabilities.total:,.2f}")
    print(f"  [BALANCE SHEET] Total Capital (inc. Retained):  INR {bs.capital.total:,.2f}")
    print(f"  [BALANCE SHEET] Liabilities + Capital:          INR {bs.total_liabilities_and_capital:,.2f}")
    print(f"  [BALANCE SHEET] Ledger Balanced (Audit Pass):   {bs.is_balanced}")

    if not bs.is_balanced:
        raise RuntimeError(f"Audit failure: Balance sheet is unbalanced! Assets={bs.assets.total} != Liab+Cap={bs.total_liabilities_and_capital}")


# Seeds deterministic dummy data for Phase 6 Analytic Accounts and Budgets
def seed_phase6_analytic_and_budget_data(db):
    """
    Seed deterministic dummy data for Analytic Accounts and Budgets (Phase 6, P1):
    1. Cost and Revenue Centers (Analytic Accounts)
    2. Operational Budgets (Draft and Confirmed targets)
    3. Tag existing lines for live variance tracking demo
    """
    print("\n--- Seeding Phase 6 Analytic Accounts & Budgets ---")

    # 1. Analytic Accounts
    accounts_data = [
        {
            "code": "ANL-OFFICE-01",
            "name": "Office Furniture Project",
            "type": "expense",
            "description": "Cost center for corporate office procurement & fitouts",
        },
        {
            "code": "ANL-SHOWROOM-01",
            "name": "Showroom Renovation",
            "type": "expense",
            "description": "Capital expenditure for showroom visual upgrades",
        },
        {
            "code": "ANL-CORP-01",
            "name": "Corporate Custom Orders",
            "type": "income",
            "description": "Revenue center for bespoke enterprise sales",
        },
    ]

    for ad in accounts_data:
        acc = db.query(AnalyticAccount).filter(AnalyticAccount.code == ad["code"]).first()
        if not acc:
            db.add(AnalyticAccount(**ad, is_active=True))
    db.commit()

    office_acc = db.query(AnalyticAccount).filter(AnalyticAccount.code == "ANL-OFFICE-01").first()
    showroom_acc = db.query(AnalyticAccount).filter(AnalyticAccount.code == "ANL-SHOWROOM-01").first()
    corp_acc = db.query(AnalyticAccount).filter(AnalyticAccount.code == "ANL-CORP-01").first()

    # 2. Tag existing VendorBillLines and CustomerInvoiceLines with analytic accounts if untagged
    bill_lines = db.query(VendorBillLine).filter(VendorBillLine.analytic_account_id.is_(None)).all()
    for bl in bill_lines:
        bl.analytic_account_id = office_acc.id

    inv_lines = db.query(CustomerInvoiceLine).filter(CustomerInvoiceLine.analytic_account_id.is_(None)).all()
    for il in inv_lines:
        il.analytic_account_id = corp_acc.id
    db.commit()

    # 3. Seed Budgets
    existing_budgets = db.query(Budget).count()
    if existing_budgets >= 2:
        print(f"[INFO] Budgets already seeded ({existing_budgets} found). Skipping creation.")
    else:
        now = datetime.now(timezone.utc)
        p_start = datetime(now.year, 1, 1, tzinfo=timezone.utc)
        p_end = datetime(now.year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        # Budget 1: Confirmed Office Furniture Project
        b1_in = BudgetCreate(
            name=f"Annual Office Fitout Budget {now.year}",
            analytic_account_id=office_acc.id,
            period_start=p_start,
            period_end=p_end,
            committed_amount=350000.0,
        )
        b1_resp = budget_service.create_budget(db, b1_in)
        b1_conf = budget_service.confirm_budget(db, b1_resp.id)
        print(f"  [CONFIRMED BUDGET] '{b1_conf.name}' (Committed: INR {b1_conf.committed_amount:,.2f}) -> Achieved: INR {b1_conf.achieved_amount:,.2f} ({b1_conf.achieved_pct:.1f}%)")

        # Budget 2: Draft Showroom Renovation
        b2_in = BudgetCreate(
            name=f"Showroom Upgrade Allocation {now.year}",
            analytic_account_id=showroom_acc.id,
            period_start=p_start,
            period_end=p_end,
            committed_amount=150000.0,
        )
        b2_resp = budget_service.create_budget(db, b2_in)
        print(f"  [DRAFT BUDGET] '{b2_resp.name}' (Committed: INR {b2_resp.committed_amount:,.2f}) -> Status: {b2_resp.status}")

        # Budget 3: Confirmed Corporate Custom Revenue Target
        b3_in = BudgetCreate(
            name=f"Corporate Sales Revenue Target {now.year}",
            analytic_account_id=corp_acc.id,
            period_start=p_start,
            period_end=p_end,
            committed_amount=500000.0,
        )
        b3_resp = budget_service.create_budget(db, b3_in)
        b3_conf = budget_service.confirm_budget(db, b3_resp.id)
        print(f"  [CONFIRMED BUDGET] '{b3_conf.name}' (Committed: INR {b3_conf.committed_amount:,.2f}) -> Achieved: INR {b3_conf.achieved_amount:,.2f} ({b3_conf.achieved_pct:.1f}%)")


# Verifies complete Phase 7 golden-path cycle: procurement, sales, payments, and double-entry equilibrium
def verify_phase7_golden_path_cycle(db):
    """
    Phase 7 Golden-Path End-to-End Cycle Verification:
    1. Purchase Order -> Confirm -> Create Vendor Bill -> Outbound Bank Settlement
    2. Sales Order -> Confirm -> Create Customer Invoice -> Inbound Bank Settlement
    3. Live double-entry ledger equilibrium audit:
       - Asserts total debits == total credits across all JournalItem entries
       - Validates Balance Sheet equation: Assets == Liabilities + Capital
    """
    print("\n=======================================================")
    print("  PHASE 7 — GOLDEN-PATH ACCOUNTING AUDIT & HARDENING   ")
    print("=======================================================")

    # 1. Audit Procurement vertical slice
    po_count = db.query(PurchaseOrder).count()
    bill_count = db.query(VendorBill).count()
    outbound_pays = db.query(Payment).filter(Payment.payment_type == "outbound").count()
    print(f"  [PROCUREMENT VERTICAL] Purchase Orders: {po_count}, Vendor Bills: {bill_count}, Outbound Payments: {outbound_pays}")

    # 2. Audit Sales vertical slice
    so_count = db.query(SalesOrder).count()
    inv_count = db.query(CustomerInvoice).count()
    inbound_pays = db.query(Payment).filter(Payment.payment_type == "inbound").count()
    print(f"  [SALES VERTICAL]       Sales Orders: {so_count}, Customer Invoices: {inv_count}, Inbound Collections: {inbound_pays}")

    # 3. Double-entry General Ledger verification
    total_debits = float(db.query(func.coalesce(func.sum(JournalItem.debit), 0.0)).scalar())
    total_credits = float(db.query(func.coalesce(func.sum(JournalItem.credit), 0.0)).scalar())
    rounded_deb = round(total_debits, 2)
    rounded_cred = round(total_credits, 2)
    print(f"  [LEDGER TRIAL BALANCE] Total Debits: INR {rounded_deb:,.2f} | Total Credits: INR {rounded_cred:,.2f}")
    if rounded_deb != rounded_cred:
        raise RuntimeError(f"Audit failure: Trial balance is unbalanced! Debits={rounded_deb} != Credits={rounded_cred}")

    # 4. Balance sheet verification (Assets == Liabilities + Capital)
    bs = report_service.get_balance_sheet(db)
    print(f"  [BALANCE SHEET AUDIT]  Total Assets:                  INR {bs.assets.total:,.2f}")
    print(f"  [BALANCE SHEET AUDIT]  Total Liabilities:             INR {bs.liabilities.total:,.2f}")
    print(f"  [BALANCE SHEET AUDIT]  Total Capital (inc. Retained): INR {bs.capital.total:,.2f}")
    print(f"  [BALANCE SHEET AUDIT]  Liabilities + Capital:         INR {bs.total_liabilities_and_capital:,.2f}")
    print(f"  [BALANCE SHEET AUDIT]  Equilibrium Verified:          {bs.is_balanced}")

    if not bs.is_balanced:
        raise RuntimeError(
            f"Audit failure: Balance sheet equation does not balance! "
            f"Assets ({bs.assets.total}) != Liabilities + Capital ({bs.total_liabilities_and_capital})"
        )
    print("  [AUDIT RESULT] PASS - Complete golden-path accounting cycle verified with mathematical equilibrium!")
    print("=======================================================\n")


def run_seed():
    """Main seed orchestrator."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(50) UNIQUE"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'goods'"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2)"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT"))
        conn.execute(text("ALTER TABLE journals ADD COLUMN IF NOT EXISTS default_account_id INTEGER REFERENCES accounts(id)"))
        conn.execute(text("ALTER TABLE journal_items ALTER COLUMN debit TYPE NUMERIC(15, 2) USING debit::NUMERIC(15, 2)"))
        conn.execute(text("ALTER TABLE journal_items ALTER COLUMN credit TYPE NUMERIC(15, 2) USING credit::NUMERIC(15, 2)"))
        conn.execute(text("ALTER TABLE journal_entries ALTER COLUMN total_amount TYPE NUMERIC(15, 2) USING total_amount::NUMERIC(15, 2)"))
        conn.execute(text("ALTER TABLE payments ALTER COLUMN amount TYPE NUMERIC(15, 2) USING amount::NUMERIC(15, 2)"))
        conn.execute(text("ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE customer_invoices ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ"))
        conn.commit()

    db = SessionLocal()
    try:
        # 1. Chart of Accounts and Journals
        seed_accounting_defaults(db)

        # 2. Demo Users
        seed_users(db)

        # 3. Contacts and Products
        seed_contacts_and_products(db)

        # 4. P0-BE-06 Procurement, Vendor Bills, and Auto Journal Entries
        seed_p0_be_06_data(db)

        # 5. Phase 3 Sales Orders, Customer Invoices, and Auto Journal Entries
        seed_phase3_sales_data(db)

        # 6. Phase 4 Inbound & Outbound Payments
        seed_phase4_payment_data(db)

        # 7. Phase 5 Report Verification (P&L and Balance Sheet)
        verify_phase5_reports(db)

        # 8. Phase 6 Analytic Accounts & Budgets
        seed_phase6_analytic_and_budget_data(db)

        # 9. Phase 7 Full Golden-Path Accounting Cycle & Equilibrium Audit
        verify_phase7_golden_path_cycle(db)

        print("\n[SUCCESS] Master, Dummy data, & Financial Reports verified successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
