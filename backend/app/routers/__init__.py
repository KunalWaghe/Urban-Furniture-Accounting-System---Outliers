from app.routers.auth import router as auth_router
from app.routers.users import router as user_router
from app.routers.contacts import router as contact_router
from app.routers.products import router as product_router
from app.routers.accounts import router as account_router
from app.routers.journals import router as journal_router

__all__ = [
    "auth_router",
    "user_router",
    "contact_router",
    "product_router",
    "account_router",
    "journal_router",
]

