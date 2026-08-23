"""SQLAlchemy engine, session factory, and declarative base."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings

settings = get_settings()

# check_same_thread=False is required for SQLite when accessed from
# FastAPI's background tasks, which may run on a different thread
# than the request that created the session factory. StaticPool is
# additionally required for ":memory:" databases so every checkout
# shares the same connection instead of each getting its own empty DB.
_is_sqlite = settings.database_url.startswith("sqlite")
_is_memory = ":memory:" in settings.database_url
_connect_args = {"check_same_thread": False} if _is_sqlite else {}
_engine_kwargs = {"connect_args": _connect_args}
if _is_memory:
    _engine_kwargs["poolclass"] = StaticPool

engine = create_engine(settings.database_url, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import models here so they register on Base.metadata before create_all.
    from app.models import meeting  # noqa: F401

    Base.metadata.create_all(bind=engine)
