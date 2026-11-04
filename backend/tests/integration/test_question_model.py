"""Structured question persistence against a disposable Postgres database."""

import os
from collections.abc import Iterator
from uuid import uuid4

import psycopg
import pytest
from psycopg import sql
from psycopg.conninfo import make_conninfo
from pydantic import ValidationError

from codeexpert.domain import Constraints, ContentAxis, Difficulty, StepRecord
from codeexpert.store.postgres import PostgresStore
from codeexpert.workspace import RunWorkspace

pytestmark = pytest.mark.integration


@pytest.fixture
def store() -> Iterator[PostgresStore]:
    url = os.environ.get("CODEEXPERT_TEST_DATABASE_URL")
    if not url:
        pytest.skip("CODEEXPERT_TEST_DATABASE_URL is not set")
    store = PostgresStore(url)
    yield store
    store._pool.close()


@pytest.fixture
def generated(store: PostgresStore) -> Iterator[RunWorkspace]:
    workspace = RunWorkspace.create(store)
    workspace.write_json("statement.json", {"name": "Soma", "statement": "Some dois números.\n"})
    workspace.write_text("solution.c", "int main(void) { return 0; }\n")
    # Execution results are fixtures here; persistence must preserve them verbatim.
    workspace.write_json(
        "testcases.json",
        {
            "testcases": [
                {"input": "1 2\n", "output": "3\n"},
                {"input": "1 2\n", "output": "3\n"},
                {"input": "", "output": ""},
            ]
        },
    )
    metadata = workspace.read_metadata()
    metadata.constraints = Constraints(
        difficulty=Difficulty.MEDIO, axis=ContentAxis.FUNDAMENTOS, can_has_if=False
    )
    metadata.input_quantity = 3
    metadata.steps = [
        StepRecord(
            step="statement",
            model="fake-model",
            prompt_version="v1",
            finished_at="2026-11-04T12:00:00+00:00",
        ),
        StepRecord(step="testcases", finished_at="2026-11-04T12:01:00+00:00"),
    ]
    workspace.write_metadata(metadata)
    yield workspace
    workspace.delete()


def test_completed_question_survives_a_new_store(
    store: PostgresStore, generated: RunWorkspace
) -> None:
    assert store.get_question(generated.run_id) is None
    generated.complete()
    other = PostgresStore(os.environ["CODEEXPERT_TEST_DATABASE_URL"])
    try:
        question = other.get_question(generated.run_id)
        assert question is not None
        assert question.run_id == generated.run_id
        assert question.statement.statement == "Some dois números.\n"
        assert question.statement.name == "Soma"
        assert question.reference_solution == generated.read_text("solution.c")
        assert question.constraints == generated.read_metadata().constraints
        assert question.difficulty == Difficulty.MEDIO
        assert question.axis == ContentAxis.FUNDAMENTOS
        assert question.state == "draft"
        assert question.metadata == generated.read_metadata()
        assert [case.model_dump() for case in question.testcases] == (
            generated.read_json("testcases.json")["testcases"]
        )
        with other._pool.connection() as conn:
            assert conn.execute(
                "SELECT input_tokens, output_tokens, cost FROM runs WHERE run_id = %s",
                (generated.run_id,),
            ).fetchone() == (None, None, None)
            # Reading the bank must not silently fall back to artifact JSON.
            conn.execute("DELETE FROM run_artifacts WHERE run_id = %s", (generated.run_id,))
        assert other.get_question(generated.run_id) == question
    finally:
        other._pool.close()


def test_recompletion_replaces_cases_and_preserves_unknown_axis(
    store: PostgresStore, generated: RunWorkspace
) -> None:
    generated.complete()
    metadata = generated.read_metadata()
    metadata.constraints = Constraints()
    generated.write_metadata(metadata)
    generated.write_json("testcases.json", {"testcases": [{"input": "9\n", "output": "9\n"}]})
    generated.complete()
    generated.complete()
    question = store.get_question(generated.run_id)
    assert question is not None
    assert question.axis is None
    assert len(question.testcases) == 1
    assert question.testcases[0].output == "9\n"


def test_invalid_snapshot_does_not_complete_a_run(
    store: PostgresStore, generated: RunWorkspace
) -> None:
    generated.write_json("testcases.json", {"testcases": [{"input": "broken"}]})
    with pytest.raises(ValidationError):
        generated.complete()
    assert not generated.is_complete()
    assert store.get_question(generated.run_id) is None


def test_database_failure_rolls_back_snapshot(
    store: PostgresStore, generated: RunWorkspace
) -> None:
    generated.complete()
    previous = store.get_question(generated.run_id)
    generated.write_json("statement.json", {"name": "Changed", "statement": "Changed"})
    # Postgres text rejects NUL after the question upsert has already executed.
    generated.write_json("testcases.json", {"testcases": [{"input": "\u0000", "output": ""}]})
    with pytest.raises(Exception, match=r"NUL|0x00"):
        generated.complete()
    assert store.get_question(generated.run_id) == previous


def test_delete_cascades_to_question_and_cases(
    store: PostgresStore, generated: RunWorkspace
) -> None:
    generated.complete()
    generated.delete()
    assert store.get_question(generated.run_id) is None
    with store._pool.connection() as conn:
        assert conn.execute(
            "SELECT count(*) FROM test_cases WHERE run_id = %s", (generated.run_id,)
        ).fetchone() == (0,)


def test_mismatched_metadata_cannot_link_another_run(
    store: PostgresStore, generated: RunWorkspace
) -> None:
    metadata = generated.read_metadata()
    metadata.run_id = "20261104T120000Z-deadbeef"
    generated.write_metadata(metadata)
    with pytest.raises(ValueError, match="run_id"):
        generated.complete()
    assert not generated.is_complete()
    assert store.get_question(generated.run_id) is None


def test_existing_schema_is_upgraded_without_losing_artifacts(store: PostgresStore) -> None:
    url = os.environ["CODEEXPERT_TEST_DATABASE_URL"]
    schema = "issue16_" + uuid4().hex
    with psycopg.connect(url, autocommit=True) as admin:
        admin.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))
        upgraded = None
        try:
            legacy_url = make_conninfo(url, options=f"-csearch_path={schema}")
            with psycopg.connect(legacy_url) as conn:
                conn.execute("""
                    CREATE TABLE runs (
                        run_id text PRIMARY KEY,
                        status text NOT NULL DEFAULT 'draft',
                        created_at timestamptz NOT NULL DEFAULT now(),
                        completed_at timestamptz
                    );
                    CREATE TABLE run_artifacts (
                        run_id text REFERENCES runs(run_id) ON DELETE CASCADE,
                        name text NOT NULL, content text NOT NULL,
                        updated_at timestamptz NOT NULL DEFAULT now(),
                        PRIMARY KEY (run_id, name)
                    );
                    INSERT INTO runs (run_id) VALUES ('legacy');
                    INSERT INTO run_artifacts (run_id, name, content)
                    VALUES ('legacy', 'solution.c', 'legacy source');
                """)
            upgraded = PostgresStore(legacy_url)
            assert upgraded.get("legacy", "solution.c") == "legacy source"
            assert upgraded.get_question("legacy") is None
            with upgraded._pool.connection() as conn:
                assert conn.execute(
                    "SELECT input_tokens, output_tokens, cost FROM runs WHERE run_id = 'legacy'"
                ).fetchone() == (None, None, None)
        finally:
            if upgraded is not None:
                upgraded._pool.close()
            admin.execute(sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema)))
