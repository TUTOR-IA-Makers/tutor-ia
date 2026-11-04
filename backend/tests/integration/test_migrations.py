"""The schema comes from the migrations, and only from them. See docs/adr/0013.

Every test gets an empty database of its own and skips itself when
`CODEEXPERT_TEST_DATABASE_URL` is unset, so `make check` stays offline.
"""

import psycopg
import pytest

from codeexpert.errors import ConfigurationError
from codeexpert.store.migrate import current_revision, downgrade, head_revision, upgrade
from codeexpert.store.postgres import PostgresStore

pytestmark = [pytest.mark.integration, pytest.mark.postgres]

# What `PostgresStore` used to apply on startup, before migrations existed.
LEGACY_STARTUP_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    run_id       text PRIMARY KEY,
    status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS run_artifacts (
    run_id     text NOT NULL REFERENCES runs (run_id) ON DELETE CASCADE,
    name       text NOT NULL,
    content    text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (run_id, name)
);
"""


def _tables(dsn: str) -> set[str]:
    with psycopg.connect(dsn) as conn:
        rows = conn.execute(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        ).fetchall()
    return {row[0] for row in rows}


def _revision(dsn: str) -> str | None:
    with psycopg.connect(dsn) as conn:
        return current_revision(conn)


def test_an_empty_database_is_migrated_to_head(empty_database: str) -> None:
    assert _revision(empty_database) is None

    upgrade(empty_database)

    assert _revision(empty_database) == head_revision()
    assert {"runs", "run_artifacts", "alembic_version"} <= _tables(empty_database)


def test_migrating_twice_changes_nothing(empty_database: str) -> None:
    """The deploy runs `migrate` on every release, including ones with no new revision."""
    upgrade(empty_database)
    upgrade(empty_database)

    assert _revision(empty_database) == head_revision()


def test_every_revision_downgrades_and_upgrades_again(empty_database: str) -> None:
    upgrade(empty_database)
    downgrade(empty_database, "base")

    assert _tables(empty_database) == {"alembic_version"}
    assert _revision(empty_database) is None

    upgrade(empty_database)
    assert _revision(empty_database) == head_revision()


def test_a_database_made_by_the_old_startup_schema_is_adopted(empty_database: str) -> None:
    with psycopg.connect(empty_database) as conn:
        conn.execute(LEGACY_STARTUP_SCHEMA)
        conn.execute("INSERT INTO runs (run_id) VALUES ('kept')")

    upgrade(empty_database)

    assert _revision(empty_database) == head_revision()
    with psycopg.connect(empty_database) as conn:
        assert conn.execute("SELECT run_id FROM runs").fetchall() == [("kept",)]


def test_the_store_refuses_a_database_that_was_not_migrated(empty_database: str) -> None:
    with pytest.raises(ConfigurationError, match="codeexpert migrate"):
        PostgresStore(empty_database)


def test_the_store_starts_on_a_migrated_database(empty_database: str) -> None:
    upgrade(empty_database)

    store = PostgresStore(empty_database)
    try:
        store.create_run("r1")
        assert store.run_exists("r1")
    finally:
        store.close()
