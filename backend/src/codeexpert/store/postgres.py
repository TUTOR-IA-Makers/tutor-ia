"""A run's artefacts in Postgres.

Two tables: `runs` carries the status, `run_artifacts` one row per artefact. A
row per artefact (not one document per run) means two steps writing different
artefacts never overwrite each other. See docs/adr/0012.
"""

from importlib import resources

from psycopg_pool import ConnectionPool


class PostgresStore:
    def __init__(self, dsn: str) -> None:
        self._pool = ConnectionPool(dsn, min_size=1, max_size=5, open=True)
        schema = (resources.files("codeexpert.store") / "schema.sql").read_text(encoding="utf-8")
        with self._pool.connection() as conn:
            conn.execute(schema)

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
