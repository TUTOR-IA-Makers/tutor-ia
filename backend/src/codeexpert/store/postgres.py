"""A run's artefacts in Postgres.

`runs` carries the status, `run_artifacts` one row per artefact. A
row per artefact (not one document per run) means two steps writing different
artefacts never overwrite each other. See docs/adr/0012.
"""

import json
from importlib import resources

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

from codeexpert.domain import RunMetadata, Statement, StoredQuestion, TestCase


def _save_question(conn: Connection, run_id: str) -> None:
    """Snapshot a complete artifact set in the caller's completion transaction."""
    artifacts = dict(
        conn.execute(
            "SELECT name, content FROM run_artifacts WHERE run_id = %s", (run_id,)
        ).fetchall()
    )
    required = {"statement.json", "solution.c", "testcases.json", "meta.json"}
    if not required <= artifacts.keys():
        # ArtifactStore also supports runs without a generated question.
        return
    statement = Statement.model_validate_json(artifacts["statement.json"])
    metadata = RunMetadata.model_validate_json(artifacts["meta.json"])
    if metadata.run_id != run_id:
        raise ValueError("Metadata run_id must match the generation run.")
    cases = [
        TestCase.model_validate(item)
        for item in json.loads(artifacts["testcases.json"])["testcases"]
    ]
    constraints = metadata.constraints
    requested = Jsonb(constraints.model_dump(mode="json")) if constraints else None
    conn.execute(
        """
        UPDATE runs SET created_at = %s, constraints = %s, input_quantity = %s,
                        reviewed = %s, steps = %s WHERE run_id = %s
        """,
        (
            metadata.created_at,
            requested,
            metadata.input_quantity,
            metadata.reviewed,
            Jsonb([step.model_dump(mode="json") for step in metadata.steps]),
            run_id,
        ),
    )
    conn.execute(
        """
        INSERT INTO questions
            (run_id, name, statement, reference_solution, constraints, difficulty, axis)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (run_id) DO UPDATE SET
            name = EXCLUDED.name, statement = EXCLUDED.statement,
            reference_solution = EXCLUDED.reference_solution,
            constraints = EXCLUDED.constraints, difficulty = EXCLUDED.difficulty,
            axis = EXCLUDED.axis
        """,
        (
            run_id,
            statement.name,
            statement.statement,
            artifacts["solution.c"],
            requested,
            constraints.difficulty.value if constraints else None,
            constraints.axis.value if constraints and constraints.axis else None,
        ),
    )
    conn.execute("DELETE FROM test_cases WHERE run_id = %s", (run_id,))
    with conn.cursor() as cursor:
        cursor.executemany(
            "INSERT INTO test_cases (run_id, position, input, output) VALUES (%s, %s, %s, %s)",
            [(run_id, index, case.input, case.output) for index, case in enumerate(cases)],
        )


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
            # Keep artifact writes from interleaving with the completion snapshot.
            conn.execute("SELECT run_id FROM runs WHERE run_id = %s FOR UPDATE", (run_id,))
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
            conn.execute("SELECT run_id FROM runs WHERE run_id = %s FOR UPDATE", (run_id,))
            _save_question(conn, run_id)
            conn.execute(
                "UPDATE runs SET status = 'complete', completed_at = now() WHERE run_id = %s",
                (run_id,),
            )

    def get_question(self, run_id: str) -> StoredQuestion | None:
        """Read structured data without depending on the artifact documents."""
        with self._pool.connection() as conn, conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT q.*, r.created_at, r.input_quantity, r.reviewed, r.steps,
                    COALESCE((SELECT jsonb_agg(
                        jsonb_build_object('input', t.input, 'output', t.output)
                        ORDER BY t.position)
                        FROM test_cases t WHERE t.run_id = q.run_id), '[]'::jsonb) AS testcases
                FROM questions q JOIN runs r USING (run_id)
                WHERE q.run_id = %s AND r.status = 'complete'
                """,
                (run_id,),
            )
            row = cursor.fetchone()
        if row is None:
            return None
        return StoredQuestion(
            run_id=run_id,
            statement=Statement(name=row["name"], statement=row["statement"]),
            reference_solution=row["reference_solution"],
            constraints=row["constraints"],
            difficulty=row["difficulty"],
            axis=row["axis"],
            state=row["state"],
            testcases=row["testcases"],
            metadata=RunMetadata(
                run_id=run_id,
                created_at=row["created_at"].isoformat(),
                constraints=row["constraints"],
                input_quantity=row["input_quantity"],
                reviewed=row["reviewed"],
                steps=row["steps"],
            ),
        )

    def is_complete(self, run_id: str) -> bool:
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT status = 'complete' FROM runs WHERE run_id = %s", (run_id,)
            ).fetchone()
        return bool(row and row[0])
