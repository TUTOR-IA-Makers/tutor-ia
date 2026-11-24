"""Where a run's artefacts live, and what that makes possible. See docs/adr/0012.

The contract tests run against every backend. The Postgres one needs a database
and skips itself when `CODEEXPERT_TEST_DATABASE_URL` is unset, the same way the
gcc tests skip without a compiler.
"""

import os
from collections.abc import Callable
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from codeexpert.domain import Constraints, JobRecord, JobState, QuestionState
from codeexpert.errors import CodeExpertError, InvalidTransitionError, RunNotFoundError
from codeexpert.export import export_run
from codeexpert.generation import (
    create_question,
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


@pytest.fixture(params=["local", "memory", "postgres"])
def make_store(request: pytest.FixtureRequest, tmp_path: Path) -> StoreFactory:
    """A factory, because the point of most tests is two stores on the same data."""
    if request.param == "local":
        return lambda: LocalFilesystemStore(tmp_path / "shared-runs")
    if request.param == "memory":
        shared = MemoryStore()
        return lambda: shared
    url = os.environ.get("CODEEXPERT_TEST_DATABASE_URL")
    if not url:
        pytest.skip("CODEEXPERT_TEST_DATABASE_URL is not set")

    from codeexpert.store.postgres import PostgresStore

    return lambda: PostgresStore(url)


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


def test_listing_returns_each_run_with_only_the_artefacts_asked_for(
    make_store: StoreFactory,
) -> None:
    store = make_store()
    full, empty = new_run_id(), new_run_id()
    for run_id in (full, empty):
        store.create_run(run_id)
    store.put(full, "draft.json", "{}")
    store.put(full, "solution.c", "int main(void) { return 0; }")
    assert store.set_state(full, QuestionState.GERANDO, QuestionState.GERADA)

    # A shared Postgres may hold other tests' runs; only these two are ours.
    listed = {item.run_id: item for item in store.list_runs(["draft.json", "meta.json"])}

    assert listed[full].artifacts == {"draft.json": "{}"}
    assert listed[full].state is QuestionState.GERADA
    assert listed[empty].artifacts == {}
    assert listed[empty].state is QuestionState.GERANDO


def test_listing_carries_each_run_job_record(make_store: StoreFactory) -> None:
    store = make_store()
    with_job, without_job = new_run_id(), new_run_id()
    for run_id in (with_job, without_job):
        store.create_run(run_id)
    store.put(with_job, "draft.json", "{}")
    job = JobRecord(
        state=JobState.INTERROMPIDO, step="inputs", updated_at="2026-11-18T12:00:00+00:00"
    )
    store.save_job(with_job, job)

    listed = {item.run_id: item for item in store.list_runs(["draft.json"])}

    assert listed[with_job].job == job
    assert listed[with_job].artifacts == {"draft.json": "{}"}
    assert listed[without_job].job is None


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
    export = export_run(second_process)

    assert len(testcases) == 2
    assert export.question_count == 1
    assert second_process.is_complete()
    assert not (tmp_path / "runs" / first_process.run_id).exists()


def test_a_new_run_is_gerando_and_its_state_survives_another_store(
    make_store: StoreFactory,
) -> None:
    run_id = new_run_id()
    make_store().create_run(run_id)
    assert make_store().get_state(run_id) is QuestionState.GERANDO

    assert make_store().set_state(run_id, QuestionState.GERANDO, QuestionState.GERADA)

    assert make_store().get_state(run_id) is QuestionState.GERADA


def test_set_state_refuses_a_change_it_did_not_see(make_store: StoreFactory) -> None:
    """Two reviewers reading GERADA at once: only the first write wins."""
    store = make_store()
    run_id = new_run_id()
    store.create_run(run_id)
    store.set_state(run_id, QuestionState.GERANDO, QuestionState.GERADA)

    assert store.set_state(run_id, QuestionState.GERADA, QuestionState.APROVADA)
    assert not store.set_state(run_id, QuestionState.GERADA, QuestionState.REJEITADA)
    assert store.get_state(run_id) is QuestionState.APROVADA


def test_a_lost_race_is_a_conflict_not_an_overwrite(make_store: StoreFactory) -> None:
    store = make_store()
    first = RunWorkspace.create(store)
    first.complete()
    second = RunWorkspace.open(make_store(), first.run_id)

    first.transition(QuestionState.REJEITADA)
    with pytest.raises(InvalidTransitionError):
        second.transition(QuestionState.APROVADA)
    assert second.state is QuestionState.REJEITADA


def test_an_approval_is_read_back_by_another_store(make_store: StoreFactory) -> None:
    first = RunWorkspace.create(make_store())
    first.complete()

    recorded = first.approve("Profa. Ana Lima")

    reopened = RunWorkspace.open(make_store(), first.run_id)
    assert reopened.state is QuestionState.APROVADA
    assert reopened.read_metadata() == recorded
    assert recorded.reviewed is True
    assert recorded.approved_by == "Profa. Ana Lima"


def test_record_approval_refuses_a_change_it_did_not_see(make_store: StoreFactory) -> None:
    store = make_store()
    workspace = RunWorkspace.create(store)
    workspace.complete()
    workspace.transition(QuestionState.REJEITADA)
    before = workspace.read_metadata()
    attempt = before.model_copy(update={"reviewed": True, "approved_by": "Ana"})

    assert not store.record_approval(workspace.run_id, QuestionState.GERADA, attempt)
    assert store.get_state(workspace.run_id) is QuestionState.REJEITADA
    assert workspace.read_metadata() == before


def test_an_approval_that_loses_the_race_to_another_approval_succeeds(
    make_store: StoreFactory,
) -> None:
    """Two teachers press Aprovar at once: both see APROVADA, the first name stays."""
    first = RunWorkspace.create(make_store())
    first.complete()
    second = RunWorkspace.open(make_store(), first.run_id)

    class _SeesGeradaOnce:
        """The second request read GERADA just before the first one wrote."""

        def __init__(self, store: ArtifactStore) -> None:
            self._store = store
            self._stale = True

        def __getattr__(self, name: str) -> object:
            return getattr(self._store, name)

        def get_state(self, run_id: str) -> QuestionState:
            if self._stale:
                self._stale = False
                return QuestionState.GERADA
            return self._store.get_state(run_id)

    winner = first.approve("Profa. Ana Lima")
    second._store = _SeesGeradaOnce(second._store)

    assert second.approve("Prof. Outro") == winner
    assert first.read_metadata().approved_by == "Profa. Ana Lima"


def test_a_local_run_from_before_the_lifecycle_reads_as_gerada(tmp_path: Path) -> None:
    store = LocalFilesystemStore(tmp_path)
    run_id = new_run_id()
    store.create_run(run_id)
    store.mark_complete(run_id)  # what a finished run looked like: no state file

    assert store.get_state(run_id) is QuestionState.GERADA


def test_opening_an_unknown_run_is_a_404_for_every_backend(make_store: StoreFactory) -> None:
    with pytest.raises(RunNotFoundError):
        RunWorkspace.open(make_store(), "20260918T120000Z-deadbeef")


# ── The generation job (G0-8, docs/adr/0017) ──────────────────────────────────

NOW = "2026-11-18T12:00:00+00:00"


def _job(state: JobState, step: str | None = None) -> JobRecord:
    return JobRecord(state=state, step=step, updated_at=NOW)


def test_a_run_has_no_job_until_one_is_saved(make_store: StoreFactory) -> None:
    store = make_store()
    run_id = new_run_id()
    store.create_run(run_id)

    assert store.get_job(run_id) is None


def test_a_job_round_trips_through_another_store(make_store: StoreFactory) -> None:
    run_id = new_run_id()
    make_store().create_run(run_id)
    job = JobRecord(
        state=JobState.FALHOU,
        step="testcases",
        failure_reason="A solução gerada não compilou.",
        error="CompilationError",
        updated_at=NOW,
    )

    make_store().save_job(run_id, job)

    assert make_store().get_job(run_id) == job


def test_replace_job_refuses_a_change_it_did_not_see(make_store: StoreFactory) -> None:
    store = make_store()
    run_id = new_run_id()
    store.create_run(run_id)

    assert store.replace_job(run_id, None, _job(JobState.INTERROMPIDO, "code"))
    assert not store.replace_job(run_id, None, _job(JobState.EM_ANDAMENTO))
    assert store.replace_job(run_id, JobState.INTERROMPIDO, _job(JobState.EM_ANDAMENTO, "code"))
    # The second of two resumes expects INTERROMPIDO and finds it already taken.
    assert not store.replace_job(run_id, JobState.INTERROMPIDO, _job(JobState.EM_ANDAMENTO))
    assert store.get_job(run_id) == _job(JobState.EM_ANDAMENTO, "code")


def test_a_restart_interrupts_only_running_jobs_and_keeps_their_step(
    make_store: StoreFactory,
) -> None:
    store = make_store()
    ids = {state: new_run_id() for state in JobState}
    for state, run_id in ids.items():
        store.create_run(run_id)
        store.save_job(run_id, _job(state, "inputs"))

    interrupted = make_store().interrupt_running_jobs()

    # Postgres shares one database across tests, so only these runs are checked.
    assert ids[JobState.EM_ANDAMENTO] in interrupted
    assert not {ids[s] for s in JobState if s is not JobState.EM_ANDAMENTO} & set(interrupted)
    job = store.get_job(ids[JobState.EM_ANDAMENTO])
    assert job.state is JobState.INTERROMPIDO
    assert job.step == "inputs"
    for state in (JobState.FALHOU, JobState.CONCLUIDO, JobState.INTERROMPIDO):
        assert store.get_job(ids[state]).state is state
    assert ids[JobState.EM_ANDAMENTO] not in make_store().interrupt_running_jobs()


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


# ── A generation that fails midway is not a question ──────────────────────────


def test_a_failed_run_is_not_visible_and_can_be_resumed(
    workspace: RunWorkspace, statement_response: str
) -> None:
    llm = FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    with pytest.raises(CodeExpertError):
        create_question(workspace, Constraints(), 2, llm, FakeRunner(timeout_on="1\n2\n"))
    assert not workspace.is_complete()

    # The client resumes by run id: the runner is fixed, the earlier steps are kept.
    generate_testcases(workspace, FakeRunner())
    export_run(workspace)
    assert workspace.is_complete()


def test_get_question_hides_a_draft_and_shows_it_once_complete(
    client: TestClient, statement_response: str
) -> None:
    client.fake_llm._responses.extend([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    run_id = client.post("/gen_statement", json={}).json()["run_id"]
    client.post("/gen_code", json={"run_id": run_id})
    client.post("/gen_inputs", json={"run_id": run_id, "qty": 2})
    client.post("/gen_testcases", json={"run_id": run_id})

    assert client.get(f"/questions/{run_id}").status_code == 404

    client.post("/export_moodle_xml_question", json={"run_id": run_id})
    response = client.get(f"/questions/{run_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["run_id"] == run_id
    assert body["statement"]["name"] == "Soma de dois numeros"
    assert body["code"] == SOLUTION_SOURCE
    assert body["inputs"] == ["1\n2\n", "10\n20\n"]
    assert [case["input"] for case in body["testcases"]] == ["1\n2\n", "10\n20\n"]
    assert [step["step"] for step in body["metadata"]["steps"]] == [
        "statement",
        "code",
        "inputs",
        "testcases",
    ]


def test_get_question_for_an_unknown_run_is_404(client: TestClient) -> None:
    assert client.get("/questions/20260918T120000Z-deadbeef").status_code == 404
