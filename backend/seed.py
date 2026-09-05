"""
Deterministic Demo Seed Script for Urban Furniture Accounting System.
Run via: .venv/bin/python seed.py
"""

from datetime import datetime

from app.core.database import SessionLocal, engine, Base
from app.models.contact import Contact
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.models.analytic_account import AnalyticAccount
from app.services.accounting_service import seed_accounting_defaults
from app.services import purchase_order_service
from app.schemas.purchase_order import POCreate, POLineCreate


ANALYTICS_DATA = [
    {"name": "Furniture Project", "budget_amount": 50000.0},
    {"name": "Office Renovation", "budget_amount": 100000.0},
    {"name": "General Operations", "budget_amount": 25000.0},
]


def seed_analytic_accounts(db):
    for item in ANALYTICS_DATA:
        existing = db.query(AnalyticAccount).filter(AnalyticAccount.name == item["name"]).first()
        if not existing:
            db.add(AnalyticAccount(**item))
    db.commit()


def seed_purchase_orders(db):
    """Seed the 3 demo POs. Skips entirely if any PO already exists,
    so PO numbers land on PO-0001..PO-0003 on a fresh table."""
    if db.query(PurchaseOrder).first():
        return

    vendor = {c.name: c for c in db.query(Contact).filter(Contact.type == "vendor").all()}
    product = {p.name: p for p in db.query(Product).all()}
    analytic = {a.name: a for a in db.query(AnalyticAccount).all()}

    # PO-0001 — Azure Furniture — 05 Sep 2026 — Confirmed — ₹5,000
    po1 = purchase_order_service.create_purchase_order(db, POCreate(
        vendor_id=vendor["Azure Furniture"].id,
        order_date=datetime(2026, 9, 5),
        lines=[POLineCreate(
            product_id=product["Wooden Chair"].id,
            analytic_account_id=analytic["Furniture Project"].id,
            quantity=10,
            unit_price=500.0,
        )],
    ))
    purchase_order_service.confirm_purchase_order(db, po1.id)

    # PO-0002 — Modern Office Supplies — 04 Sep 2026 — Draft — ₹12,500
    purchase_order_service.create_purchase_order(db, POCreate(
        vendor_id=vendor["Modern Office Supplies"].id,
        order_date=datetime(2026, 9, 4),
        lines=[
            POLineCreate(
                product_id=product["Office Chair"].id,
                analytic_account_id=analytic["Office Renovation"].id,
                quantity=5,
                unit_price=1200.0,
            ),
            POLineCreate(
                product_id=product["Storage Cabinet"].id,
                analytic_account_id=analytic["Office Renovation"].id,
                quantity=1,
                unit_price=6500.0,
            ),
        ],
    ))

    # PO-0003 — Woodcraft Vendors — 01 Sep 2026 — Confirmed — ₹8,400
    po3 = purchase_order_service.create_purchase_order(db, POCreate(
        vendor_id=vendor["Woodcraft Vendors"].id,
        order_date=datetime(2026, 9, 1),
        lines=[POLineCreate(
            product_id=product["Office Chair"].id,
            analytic_account_id=analytic["Furniture Project"].id,
            quantity=7,
            unit_price=1200.0,
        )],
    ))
    purchase_order_service.confirm_purchase_order(db, po3.id)


def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Chart of Accounts and Journals
        seed_accounting_defaults(db)

        # 2. Seed Contacts
        contacts_data = [
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
            {
                "name": "Azure Furniture",
                "type": "vendor",
                "email": "sales@azurefurniture.in",
                "mobile": "+91 98110 22334",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560001",
                "is_active": True,
            },
            {
                "name": "Modern Office Supplies",
                "type": "vendor",
                "email": "orders@modernoffice.in",
                "mobile": "+91 99220 44556",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "is_active": True,
            },
            {
                "name": "Woodcraft Vendors",
                "type": "vendor",
                "email": "supply@woodcraft.in",
                "mobile": "+91 99330 55667",
                "city": "Jaipur",
                "state": "Rajasthan",
                "pincode": "302001",
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

        # 3. Seed Products
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
            {
                "name": "Wooden Chair",
                "product_type": "goods",
                "category": "Seating",
                "price": 800.0,
                "cost": 500.0,
                "tax_percent": 18.0,
                "description": "Solid wood dining chair",
                "is_active": True,
            },
            {
                "name": "Office Chair",
                "product_type": "goods",
                "category": "Office Furniture",
                "price": 1800.0,
                "cost": 1200.0,
                "tax_percent": 18.0,
                "description": "Ergonomic office chair",
                "is_active": True,
            },
            {
                "name": "Conference Table",
                "product_type": "goods",
                "category": "Office Furniture",
                "price": 12000.0,
                "cost": 8000.0,
                "tax_percent": 18.0,
                "description": "8-seater conference table",
                "is_active": True,
            },
            {
                "name": "Storage Cabinet",
                "product_type": "goods",
                "category": "Storage",
                "price": 9500.0,
                "cost": 6500.0,
                "tax_percent": 18.0,
                "description": "Lockable office storage cabinet",
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

        # 4. Seed Analytic Accounts
        seed_analytic_accounts(db)

        # 5. Seed demo Purchase Orders (skipped if any PO exists)
        seed_purchase_orders(db)

        print("[SUCCESS] Master data seeded: Accounts, Journals, Contacts, Products, Analytics, Purchase Orders.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
