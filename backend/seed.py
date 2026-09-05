"""
Deterministic Demo Seed Script for Urban Furniture Accounting System.
Run via: .venv/bin/python seed.py
"""

from app.core.database import SessionLocal, engine, Base
from app.models.contact import Contact
from app.models.product import Product
from app.services.accounting_service import seed_accounting_defaults


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
        print("[SUCCESS] Master data seeded: Accounts, Journals, Contacts, Products.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
