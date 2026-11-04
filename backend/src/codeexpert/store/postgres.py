"""A run's artefacts in Postgres.

Two tables: `runs` carries the status, `run_artifacts` one row per artefact. A
row per artefact (not one document per run) means two steps writing different
artefacts never overwrite each other. See docs/adr/0012.

The store does not create its tables. `codeexpert migrate` does, from the
revisions in `migrations/` (docs/adr/0013), and the store refuses to start on a
database at any other revision, so a skipped migration fails the deploy instead
of the first request that touches the missing column.
"""

from psycopg_pool import ConnectionPool

from codeexpert.errors import ConfigurationError
from codeexpert.store.migrate import current_revision, head_revision


class PostgresStore:
    def __init__(self, dsn: str) -> None:
        self._pool = ConnectionPool(dsn, min_size=1, max_size=5, open=True)
        try:
            self._require_current_schema()
        except BaseException:
            self._pool.close()
            raise

    def _require_current_schema(self) -> None:
        expected = head_revision()
        with self._pool.connection() as conn:
            found = current_revision(conn)
        if found != expected:
            raise ConfigurationError(
                f"The database schema is at revision {found or 'none'}, the code expects "
                f"{expected}. Run `codeexpert migrate` against this database first."
            )

    def close(self) -> None:
        """Close the pool. The process-wide store lives until exit; tests close theirs."""
        self._pool.close()

    def create_run(self, run_id: str) -> None:
        with self._pool.connection() as conn:
            conn.execute("INSERT INTO runs (run_id) VALUES (%s)", (run_id,))

    def run_exists(self, run_id: str) -> bool:
        with self._pool.connection() as conn:
            row = conn.execute("SELECT 1 FROM runs WHERE run_id = %s", (run_id,)).fetchone()
        return row is not None

    def put(self, run_id: str, name: str, content: str) -> None:
        with self._pool.connection() as conn:
            conn.execute(
                """
                INSERT INTO run_artifacts (run_id, name, content) VALUES (%s, %s, %s)
                ON CONFLICT (run_id, name)
                DO UPDATE SET content = EXCLUDED.content, updated_at = now()
                """,
                (run_id, name, content),
            )

    def get(self, run_id: str, name: str) -> str | None:
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT content FROM run_artifacts WHERE run_id = %s AND name = %s",
                (run_id, name),
            ).fetchone()
        return row[0] if row else None

    def delete_run(self, run_id: str) -> None:
        with self._pool.connection() as conn:
            conn.execute("DELETE FROM runs WHERE run_id = %s", (run_id,))

    def mark_complete(self, run_id: str) -> None:
        with self._pool.connection() as conn:
            conn.execute(
                "UPDATE runs SET status = 'complete', completed_at = now() WHERE run_id = %s",
                (run_id,),
            )

    def is_complete(self, run_id: str) -> bool:
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT status = 'complete' FROM runs WHERE run_id = %s", (run_id,)
            ).fetchone()
        return bool(row and row[0])
