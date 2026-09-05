from app.routers.auth import router as auth_router
from app.routers.users import router as user_router
from app.routers.contacts import router as contact_router
from app.routers.products import router as product_router
from app.routers.accounts import router as account_router
from app.routers.journals import router as journal_router
from app.routers.purchase_orders import router as purchase_order_router
from app.routers.vendor_bills import router as vendor_bill_router
from app.routers.journal_entries import router as journal_entry_router

__all__ = [
    "auth_router",
    "user_router",
    "contact_router",
    "product_router",
    "account_router",
    "journal_router",
    "purchase_order_router",
    "vendor_bill_router",
    "journal_entry_router",
]

