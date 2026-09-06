"""
SQLAlchemy engine, session factory, and declarative base.

Uses SQLAlchemy 2.0 style with the new DeclarativeBase.
expire_on_commit=False allows accessing attributes after commit
without triggering lazy loads — critical for returning response data.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


# Create engine — pool_pre_ping ensures stale connections are recycled
# Cloud providers (e.g. Render, Neon) often provide postgres:// URLs which SQLAlchemy 2.0 rejects
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    _db_url,
    pool_pre_ping=True,
    echo=settings.DEBUG,  # Log SQL in debug mode
)

# Session factory — each request gets its own session via dependency injection
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass
