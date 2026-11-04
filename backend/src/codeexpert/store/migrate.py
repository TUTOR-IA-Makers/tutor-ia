"""Bring a database to the schema this code expects. See docs/adr/0013.

The schema is a chain of Alembic revisions under `migrations/versions/`. They
ship inside the package, so the image that runs the API can also migrate the
database it talks to: the Compose service `migrate` runs `codeexpert migrate`
before `api` starts, and nobody applies SQL by hand.
"""

from importlib import resources

import psycopg
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, create_engine
from sqlalchemy.pool import NullPool


def alembic_config() -> Config:
    config = Config()
    config.set_main_option(
        "script_location", str(resources.files("codeexpert.store") / "migrations")
    )
    return config


def head_revision() -> str:
    """The revision the code was written against."""
    head = ScriptDirectory.from_config(alembic_config()).get_current_head()
    if head is None:  # pragma: no cover - the package always ships revisions
        raise RuntimeError("no migrations found in codeexpert.store.migrations")
    return head


def _engine(dsn: str) -> Engine:
    # `creator` hands SQLAlchemy a psycopg connection built from the DSN as-is,
    # so a URL, a key=value string and a password with `%` in it all work, and
    # SQLAlchemy never has to guess a driver. NullPool: one command, one connection.
    return create_engine(
        "postgresql+psycopg://", creator=lambda: psycopg.connect(dsn), poolclass=NullPool
    )


def _run(dsn: str, action: str, revision: str) -> None:
    engine = _engine(dsn)
    try:
        with engine.begin() as connection:
            config = alembic_config()
            config.attributes["connection"] = connection
            getattr(command, action)(config, revision)
    finally:
        engine.dispose()


def upgrade(dsn: str, revision: str = "head") -> None:
    _run(dsn, "upgrade", revision)


def downgrade(dsn: str, revision: str) -> None:
    _run(dsn, "downgrade", revision)


def current_revision(conn: psycopg.Connection) -> str | None:
    """The revision a database is at, or `None` when it was never migrated."""
    exists = conn.execute("SELECT to_regclass('alembic_version') IS NOT NULL").fetchone()
    if not (exists and exists[0]):
        return None
    row = conn.execute("SELECT version_num FROM alembic_version").fetchone()
    return row[0] if row else None
