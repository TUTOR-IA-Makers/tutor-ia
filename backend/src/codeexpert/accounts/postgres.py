"""Teachers and sessions in Postgres, beside the runs (docs/adr/0012).

Its own small pool and its own schema file: accounts are a separate concern from
a run's artefacts, and either can change without touching the other.
"""

from datetime import datetime
from importlib import resources

from psycopg import errors
from psycopg_pool import ConnectionPool

from codeexpert.accounts.store import Teacher


class PostgresAccountStore:
    def __init__(self, dsn: str) -> None:
        self._pool = ConnectionPool(dsn, min_size=1, max_size=3, open=True)
        schema = (resources.files("codeexpert.accounts") / "schema.sql").read_text(encoding="utf-8")
        with self._pool.connection() as conn:
            conn.execute(schema)

    def create_teacher(self, teacher: Teacher, password_hash: str) -> bool:
        try:
            with self._pool.connection() as conn:
                conn.execute(
                    """
                    INSERT INTO teachers (id, name, email, department, password_hash)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (teacher.id, teacher.name, teacher.email, teacher.department, password_hash),
                )
        except errors.UniqueViolation:
            return False
        return True

    def find_by_email(self, email: str) -> tuple[Teacher, str] | None:
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT id, name, email, department, password_hash FROM teachers WHERE email = %s",
                (email,),
            ).fetchone()
        if row is None:
            return None
        return Teacher(id=row[0], name=row[1], email=row[2], department=row[3]), row[4]

    def open_session(self, teacher_id: str, token_hash: str, expires_at: datetime) -> None:
        with self._pool.connection() as conn:
            # Expired sessions are swept here, on the way in, so the table never
            # needs a scheduled job.
            conn.execute("DELETE FROM sessions WHERE expires_at <= now()")
            conn.execute(
                "INSERT INTO sessions (token_hash, teacher_id, expires_at) VALUES (%s, %s, %s)",
                (token_hash, teacher_id, expires_at),
            )

    def teacher_for_session(self, token_hash: str, now: datetime) -> Teacher | None:
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                SELECT t.id, t.name, t.email, t.department
                FROM sessions s JOIN teachers t ON t.id = s.teacher_id
                WHERE s.token_hash = %s AND s.expires_at > %s
                """,
                (token_hash, now),
            ).fetchone()
        if row is None:
            return None
        return Teacher(id=row[0], name=row[1], email=row[2], department=row[3])

    def close_session(self, token_hash: str) -> None:
        with self._pool.connection() as conn:
            conn.execute("DELETE FROM sessions WHERE token_hash = %s", (token_hash,))
