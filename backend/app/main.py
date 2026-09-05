"""
FastAPI application entry point.

Wires together:
- CORS middleware (allows frontend at localhost:3000)
- Global error handlers (standard error envelope)
- Health check endpoint (proves DB connectivity)
- Router includes (added as each P0-BE task is completed)
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
from app.routers import auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    On startup: verify database connectivity and ensure tables exist.
    """
    # Startup: verify DB connection & create tables
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        Base.metadata.create_all(bind=engine)
        print(f"[OK] Database connected & models synchronized: {settings.DATABASE_URL.split('@')[1]}")
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
# Allows the Next.js frontend (localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Error Handlers ---
# These ensure ALL errors follow the standard error envelope
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# --- Health Check ---
@app.get("/health", tags=["System"])
def health_check():
    """
    Health check endpoint.
    
    Verifies:
    1. The API process is running
    2. The database is reachable
    
    Returns 200 with status info, or 500 if DB is down.
    """
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

