from app.routers.auth import router as auth_router
from app.routers.users import router as user_router
from app.routers.contacts import router as contact_router
from app.routers.products import router as product_router
from app.routers.accounts import router as account_router
from app.routers.journals import router as journal_router
from app.routers.purchase_orders import router as purchase_order_router
from app.routers.vendor_bills import router as vendor_bill_router
from app.routers.journal_entries import router as journal_entry_router
from app.routers.payments import router as payment_router
from app.routers.sales_orders import router as sales_order_router
from app.routers.customer_invoices import router as customer_invoice_router
from app.routers.reports import router as report_router
from app.routers.analytic_accounts import router as analytic_account_router
from app.routers.budgets import router as budget_router
from app.routers.self_service import router as self_service_router

# '__all__' defines the public module symbol exports when imported via 'from app.routers import *'
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
    "payment_router",
    "sales_order_router",
    "customer_invoice_router",
    "report_router",
    "analytic_account_router",
    "budget_router",
    "self_service_router",
]


