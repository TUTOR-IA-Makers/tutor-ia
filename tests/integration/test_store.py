"""Where a run's artefacts live, and what that makes possible. See docs/adr/0012.

The contract tests run against every backend. The Postgres one needs a database
and skips itself when `CODEEXPERT_TEST_DATABASE_URL` is unset, the same way the
gcc tests skip without a compiler.
"""

from collections.abc import Callable
from pathlib import Path

import pytest

from codeexpert.domain import Constraints
from codeexpert.errors import CodeExpertError, RunNotFoundError
from codeexpert.export import export_question
from codeexpert.generation import (
    generate_code,
    generate_inputs,
    generate_statement,
    generate_testcases,
)
from codeexpert.store import ArtifactStore, LocalFilesystemStore
from codeexpert.workspace import RunWorkspace, new_run_id
from tests.conftest import FakeLLM, FakeRunner, MemoryStore

pytestmark = pytest.mark.integration

SOLUTION_SOURCE = "int main(void) { return 0; }"
INPUTS_RESPONSE = '["1\\n2\\n", "10\\n20\\n"]'

StoreFactory = Callable[[], ArtifactStore]


@pytest.fixture(params=["local", "memory"])
def make_store(request: pytest.FixtureRequest, tmp_path: Path) -> StoreFactory:
    """A factory, because the point of most tests is two stores on the same data."""
    if request.param == "local":
        return lambda: LocalFilesystemStore(tmp_path / "shared-runs")
    if request.param == "memory":
        shared = MemoryStore()
        return lambda: shared


# ── The contract every backend keeps ──────────────────────────────────────────


def test_an_artefact_round_trips(make_store: StoreFactory) -> None:
    store = make_store()
    run_id = new_run_id()
    store.create_run(run_id)

    assert store.get(run_id, "statement.json") is None
    store.put(run_id, "statement.json", "ç\n")
    store.put(run_id, "statement.json", "second")

    assert store.get(run_id, "statement.json") == "second"


def test_a_run_is_a_draft_until_it_is_completed(make_store: StoreFactory) -> None:
    store = make_store()
    run_id = new_run_id()
    store.create_run(run_id)
    assert store.run_exists(run_id)
    assert not store.is_complete(run_id)

    store.mark_complete(run_id)
    assert store.is_complete(run_id)


def test_deleting_a_run_removes_it(make_store: StoreFactory) -> None:
    store = make_store()
    run_id = new_run_id()
    store.create_run(run_id)
    store.put(run_id, "meta.json", "{}")

    store.delete_run(run_id)

    assert not store.run_exists(run_id)
    assert store.get(run_id, "meta.json") is None


# ── A run does not depend on the process or the disk that started it ──────────


def test_a_run_started_elsewhere_finishes_without_its_local_directory(
    make_store: StoreFactory, statement_response: str, tmp_path: Path
) -> None:
    """The acceptance criterion: another process picks the run up and takes it to the end."""
    first_process = RunWorkspace.create(make_store())
    generate_statement(first_process, Constraints(), FakeLLM([statement_response]))
    generate_code(first_process, FakeLLM([SOLUTION_SOURCE]))

    # A second process: its own store object, and no run directory of its own.
    # The pipeline's only disk use is the step-4 scratch directory, deleted at its end.
    second_process = RunWorkspace.open(make_store(), first_process.run_id)
    generate_inputs(second_process, 2, FakeLLM([INPUTS_RESPONSE]))
    runner = FakeRunner()
    testcases = generate_testcases(second_process, runner)
    export = export_question(second_process, output_dir=tmp_path / "out")

    assert len(testcases) == 2
    assert export.question_count == 1
    assert not (tmp_path / "runs" / first_process.run_id).exists()


def test_opening_an_unknown_run_is_a_404_for_every_backend(make_store: StoreFactory) -> None:
    with pytest.raises(RunNotFoundError):
        RunWorkspace.open(make_store(), "20260918T120000Z-deadbeef")


# ── The disk is scratch space for one step ────────────────────────────────────


def test_the_scratch_directory_is_deleted_after_the_step(workspace: RunWorkspace) -> None:
    workspace.write_text("solution.c", SOLUTION_SOURCE)
    workspace.write_json("inputs.json", {"inputs": ["1\n"]})
    runner = FakeRunner()

    generate_testcases(workspace, runner)

    assert runner.compiled, "the compiler was never handed a file"
    assert not runner.compiled[0].exists()
    assert not runner.compiled[0].parent.exists()


def test_the_scratch_directory_is_deleted_when_the_step_fails(workspace: RunWorkspace) -> None:
    workspace.write_text("solution.c", SOLUTION_SOURCE)
    workspace.write_json("inputs.json", {"inputs": ["boom"]})
    runner = FakeRunner(timeout_on="boom")

    with pytest.raises(CodeExpertError):
        generate_testcases(workspace, runner)

    assert not runner.compiled[0].parent.exists()
