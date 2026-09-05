"""
FastAPI application entry point.

Wires together:
- CORS middleware (allows frontend at localhost:3000)
- Global error handlers (standard error envelope)
- Health check endpoint (proves DB connectivity)
- Router includes (auth, contacts, products, accounts, journals)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.models import Base
from app.routers import (
    auth_router,
    user_router,
    contact_router,
    product_router,
    account_router,
    journal_router,
    purchase_order_router,
    vendor_bill_router,
    journal_entry_router,
    payment_router,
    sales_order_router,
    customer_invoice_router,
    report_router,
)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    On startup: verify database connectivity and ensure tables exist.
    """
    try:
        # Ensure all tables exist first before running any ALTER TABLE migrations
        Base.metadata.create_all(bind=engine)

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(50) UNIQUE"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ"))
            conn.execute(text("ALTER TABLE users ALTER COLUMN reset_token_expiry TYPE TIMESTAMPTZ USING reset_token_expiry AT TIME ZONE 'UTC'"))
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'goods'"))
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)"))
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2)"))
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT"))
            conn.execute(text("ALTER TABLE journals ADD COLUMN IF NOT EXISTS default_account_id INTEGER REFERENCES accounts(id)"))
            conn.commit()
        print("[OK] Database connected & models synchronized")
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        raise

    yield  # App runs here

    # Shutdown: cleanup
    engine.dispose()
    print("[SHUTDOWN] Database connections closed")


# --- Create FastAPI app ---
app = FastAPI(
    title=settings.APP_NAME,
    description="Double-entry accounting system for Urban Furniture",
    version="1.0.0",
    docs_url="/docs",          # Swagger UI
    redoc_url="/redoc",        # ReDoc
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Error Handlers ---
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# --- Health Check ---
@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint — verifies process and DB reachability."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "app": settings.APP_NAME,
        "database": db_status,
    }


# --- Root redirect ---
@app.get("/", tags=["System"])
def root():
    """Root endpoint — confirms the API is running."""
    return {
        "message": f"{settings.APP_NAME} API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# --- Router includes ---
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(contact_router, prefix="/api/v1/contacts", tags=["Contacts"])
app.include_router(product_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(account_router, prefix="/api/v1/accounts", tags=["Chart of Accounts"])
app.include_router(journal_router, prefix="/api/v1/journals", tags=["Journals"])
app.include_router(purchase_order_router, prefix="/api/v1/purchase-orders", tags=["Purchase Orders"])
app.include_router(vendor_bill_router, prefix="/api/v1/vendor-bills", tags=["Vendor Bills"])
app.include_router(journal_entry_router, prefix="/api/v1/journal-entries", tags=["Journal Entries"])
app.include_router(payment_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(sales_order_router, prefix="/api/v1/sales-orders", tags=["Sales Orders"])
app.include_router(customer_invoice_router, prefix="/api/v1/customer-invoices", tags=["Customer Invoices"])
app.include_router(report_router, prefix="/api/v1/reports", tags=["Reports"])
