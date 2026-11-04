"""Runs and their artefacts (docs/adr/0012).

Revision ID: 0001
Revises:
Create Date: 2026-11-04
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # IF NOT EXISTS only here: before migrations, `PostgresStore` created these
    # same tables itself on startup. A database made that way is adopted by this
    # revision instead of failing on it. Later revisions do not need it.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS runs (
            run_id       text PRIMARY KEY,
            status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
            created_at   timestamptz NOT NULL DEFAULT now(),
            completed_at timestamptz
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS run_artifacts (
            run_id     text NOT NULL REFERENCES runs (run_id) ON DELETE CASCADE,
            name       text NOT NULL,
            content    text NOT NULL,
            updated_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (run_id, name)
        )
        """
    )
    # The library lists finished questions, newest first.
    op.execute(
        "CREATE INDEX IF NOT EXISTS runs_complete_idx "
        "ON runs (completed_at DESC) WHERE status = 'complete'"
    )


def downgrade() -> None:
    op.execute("DROP TABLE run_artifacts")
    op.execute("DROP TABLE runs")
