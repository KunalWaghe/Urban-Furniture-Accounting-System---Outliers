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
engine = create_engine(
    settings.DATABASE_URL,
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
