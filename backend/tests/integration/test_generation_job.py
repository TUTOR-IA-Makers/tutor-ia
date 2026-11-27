"""Generation as a resumable job (G0-8, docs/adr/0017).

A restart is simulated the way it happens: the job dies mid-step without running
any `except` block (a `BaseException` the job does not catch stands in for the
process going away), and a fresh app is started over the same store. Its startup
is what finds the job and marks it `INTERROMPIDO`.

The model is always a `FakeLLM`, and the number of calls it received is the
evidence that a resumed job never pays twice for the same step.
"""

from collections.abc import Iterator
from contextlib import contextmanager

import pytest
from fastapi import BackgroundTasks
from fastapi.testclient import TestClient

from codeexpert.api.app import create_app
from codeexpert.api.deps import get_current_teacher
from codeexpert.api.drafts import QuestionDraft, to_constraints
from codeexpert.api.routes.resources import create_question_resource
from codeexpert.domain import JobRecord, JobState, QuestionState
from codeexpert.errors import JobNotResumableError, LLMError
from codeexpert.execution import get_code_runner
from codeexpert.generation.job import (
    INTERRUPTED_REASON,
    claim_resume,
    recover_interrupted_jobs,
    run_generation,
    start_job,
)
from codeexpert.llm import get_llm_client
from codeexpert.settings import get_settings
from codeexpert.store import LocalFilesystemStore
from codeexpert.workspace import DRAFT, FAILURE, RunWorkspace
from tests.conftest import TEST_TEACHER, WEB_CLIENT, FakeLLM, FakeRunner
from tests.integration.test_resource_api import DRAFT_BODY, INPUTS, SOLUTION_SOURCE

pytestmark = pytest.mark.integration


class ProcessKilled(BaseException):
    """The process going away: no `except Exception` runs, nothing is recorded."""


class DyingLLM(FakeLLM):
    """Answers the first `survive` calls, then the process dies inside the next one."""

    def __init__(self, responses: list[str], survive: int) -> None:
        super().__init__(responses)
        self._survive = survive

    def complete(self, *, system: str, user: str, temperature: float = 0.7) -> str:
        if len(self.calls) == self._survive:
            self.calls.append((system, user))
            raise ProcessKilled
        return super().complete(system=system, user=user, temperature=temperature)


@pytest.fixture
def store(isolated_settings) -> LocalFilesystemStore:
    return LocalFilesystemStore(isolated_settings.workspace_root)


@contextmanager
def server(llm: FakeLLM, runner: FakeRunner | None = None) -> Iterator[TestClient]:
    """Start the app — its startup included — with these fakes. A new call is a restart."""
    app = create_app()
    app.dependency_overrides[get_llm_client] = lambda: llm
    app.dependency_overrides[get_code_runner] = lambda: runner or FakeRunner()
    app.dependency_overrides[get_current_teacher] = lambda: TEST_TEACHER
    with TestClient(app, headers=WEB_CLIENT) as client:
        yield client


def _started_question(store: LocalFilesystemStore) -> RunWorkspace:
    """What POST /api/v1/questions leaves behind before its background task runs."""
    workspace = RunWorkspace.create(store)
    start_job(workspace)
    workspace.write_json(DRAFT, DRAFT_BODY)
    return workspace


def _crash_during(store: LocalFilesystemStore, statement: str, survive: int) -> RunWorkspace:
    """Run a job until the process dies inside model call number `survive + 1`."""
    workspace = _started_question(store)
    llm = DyingLLM([statement, SOLUTION_SOURCE, INPUTS], survive=survive)
    with pytest.raises(ProcessKilled):
        run_generation(workspace, to_constraints(QuestionDraft(**DRAFT_BODY)), 2, llm, FakeRunner())
    return workspace


def _generation(client: TestClient, question_id: str) -> dict:
    return client.get(f"/api/v1/questions/{question_id}/generation").json()


class TestAccepted:
    def test_post_answers_before_any_step_runs(self, store, statement_response) -> None:
        # The route itself, so nothing runs the background task behind our back:
        # the answer exists while the job is still only queued.
        llm = FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS])
        background = BackgroundTasks()

        created = create_question_resource(
            QuestionDraft(**DRAFT_BODY),
            background,
            store,
            llm,
            FakeRunner(),
            TEST_TEACHER,
            get_settings(),
        )

        workspace = RunWorkspace.open(store, created.id)
        assert llm.calls == []
        assert len(background.tasks) == 1
        assert workspace.read_job().state is JobState.EM_ANDAMENTO
        assert workspace.state is QuestionState.GERANDO

        task = background.tasks[0]
        task.func(*task.args, **task.kwargs)

        assert len(llm.calls) == 3
        assert workspace.read_job().state is JobState.CONCLUIDO
        assert workspace.state is QuestionState.GERADA

    def test_post_is_202_and_the_five_steps_run_afterwards(
        self, client, statement_response
    ) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]

        response = client.post("/api/v1/questions", json=DRAFT_BODY)

        assert response.status_code == 202
        generation = _generation(client, response.json()["id"])
        assert generation["status"] == "GERADA"
        assert generation["completed_steps"] == 5
        assert generation["job"]["state"] == "CONCLUIDO"
        assert generation["job"]["resumable"] is False
        assert len(client.fake_llm.calls) == 3


class TestProgress:
    def test_each_step_is_in_the_store_while_it_runs(self, store, statement_response) -> None:
        # The model is asked while its step runs; what a poll would read at that
        # moment is recorded on each call.
        seen: list[tuple[str | None, int]] = []
        workspace = _started_question(store)
        app_client: list[TestClient] = []

        class Watching(FakeLLM):
            def complete(self, *, system: str, user: str, temperature: float = 0.7) -> str:
                body = _generation(app_client[0], workspace.run_id)
                seen.append((body["job"]["step"], body["completed_steps"]))
                return super().complete(system=system, user=user, temperature=temperature)

        llm = Watching([statement_response, SOLUTION_SOURCE, INPUTS])
        with server(llm) as client:
            app_client.append(client)
            run_generation(
                workspace, to_constraints(QuestionDraft(**DRAFT_BODY)), 2, llm, FakeRunner()
            )
            final = _generation(client, workspace.run_id)

        assert seen == [("statement", 0), ("code", 1), ("inputs", 2)]
        assert final["job"]["state"] == "CONCLUIDO"
        assert final["job"]["step"] is None

    def test_the_question_resource_carries_the_job(self, client, statement_response) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        question_id = client.post("/api/v1/questions", json=DRAFT_BODY).json()["id"]

        body = client.get(f"/api/v1/questions/{question_id}").json()

        assert body["job"]["state"] == "CONCLUIDO"
        assert body["job"]["updated_at"].endswith("+00:00")

    def test_a_failure_is_recorded_in_the_job(self, client) -> None:
        class BrokenLLM:
            def complete(self, **_: object) -> str:
                raise LLMError("provider down")

        client.app.dependency_overrides[get_llm_client] = BrokenLLM
        question_id = client.post("/api/v1/questions", json=DRAFT_BODY).json()["id"]

        generation = _generation(client, question_id)

        assert generation["job"]["state"] == "FALHOU"
        assert generation["job"]["step"] == "statement"
        assert generation["job"]["resumable"] is False
        assert generation["status"] == "FALHOU_VERIFICACAO"
        assert "Tente de novo" in generation["failure_reason"]

    def test_a_failure_keeps_the_exception_name_for_the_log_reader(
        self, client, statement_response, store
    ) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        client.fake_runner.fail_compile = "solution.c:1:1: error: boom"
        question_id = client.post("/api/v1/questions", json=DRAFT_BODY).json()["id"]

        job = store.get_job(question_id)

        assert job.state is JobState.FALHOU
        assert job.step == "testcases"
        assert job.error == "CompilationError"
        assert "boom" not in job.failure_reason


class TestRestart:
    def test_a_job_killed_mid_step_reads_as_interrupted_after_a_restart(
        self, store, statement_response
    ) -> None:
        workspace = _crash_during(store, statement_response, survive=2)
        # Before the restart nothing has noticed: the record still says running.
        assert workspace.read_job().state is JobState.EM_ANDAMENTO

        with server(FakeLLM([])) as client:
            generation = _generation(client, workspace.run_id)

        assert generation["job"]["state"] == "INTERROMPIDO"
        assert generation["job"]["step"] == "inputs"
        assert generation["job"]["resumable"] is True
        assert generation["completed_steps"] == 2
        # Not GERANDO, so the progress screen stops polling and shows why.
        assert generation["status"] == "FALHOU_VERIFICACAO"
        assert generation["failure_reason"] == INTERRUPTED_REASON
        # The question state is untouched: INTERROMPIDO is the job's (ADR-0015).
        assert store.get_state(workspace.run_id) is QuestionState.GERANDO

    def test_a_job_queued_but_never_started_is_interrupted_too(self, store) -> None:
        workspace = _started_question(store)

        with server(FakeLLM([])) as client:
            generation = _generation(client, workspace.run_id)

        assert generation["job"]["state"] == "INTERROMPIDO"
        assert generation["job"]["step"] is None
        assert generation["completed_steps"] == 0

    def test_a_restart_leaves_finished_and_failed_jobs_alone(
        self, client, statement_response, store
    ) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        done = client.post("/api/v1/questions", json=DRAFT_BODY).json()["id"]
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        client.fake_runner.fail_compile = "boom"
        failed = client.post("/api/v1/questions", json=DRAFT_BODY).json()["id"]

        with server(FakeLLM([])):
            pass

        assert store.get_job(done).state is JobState.CONCLUIDO
        assert store.get_job(failed).state is JobState.FALHOU

    def test_dying_after_export_reads_as_finished(self, store, statement_response) -> None:
        # Step 5 completed the run, and the process died before saying CONCLUIDO.
        workspace = _started_question(store)
        run_generation(
            workspace,
            to_constraints(QuestionDraft(**DRAFT_BODY)),
            2,
            FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS]),
            FakeRunner(),
        )
        store.save_job(
            workspace.run_id,
            JobRecord(state=JobState.EM_ANDAMENTO, step="export", updated_at="2026-11-18T00:00Z"),
        )

        with server(FakeLLM([])) as client:
            generation = _generation(client, workspace.run_id)
            resume = client.post(f"/api/v1/questions/{workspace.run_id}/resume")

        assert generation["status"] == "GERADA"
        assert generation["job"]["state"] == "CONCLUIDO"
        assert resume.status_code == 409

    def test_a_store_that_cannot_be_reached_does_not_stop_the_server(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        # Postgres selected without a URL: the sweep fails, the site still serves.
        monkeypatch.setenv("CODEEXPERT_STORE_BACKEND", "postgres")
        # Blank, not unset: an unset variable would fall back to a developer's .env.
        monkeypatch.setenv("CODEEXPERT_DATABASE_URL", "")
        from codeexpert.settings import reset_settings_cache

        reset_settings_cache()
        with server(FakeLLM([])) as client:
            assert client.get("/health").status_code == 200


class TestResume:
    @pytest.mark.parametrize(
        ("survive", "expected_calls"),
        [(0, 3), (1, 2), (2, 1)],
        ids=["died-in-statement", "died-in-code", "died-in-inputs"],
    )
    def test_resuming_repeats_no_paid_call(
        self, store, statement_response, survive, expected_calls
    ) -> None:
        workspace = _crash_during(store, statement_response, survive=survive)
        # The call that was in flight when the process died is the only one lost.
        remaining = [statement_response, SOLUTION_SOURCE, INPUTS][survive:]
        llm = FakeLLM(remaining)

        with server(llm) as client:
            response = client.post(f"/api/v1/questions/{workspace.run_id}/resume")
            generation = _generation(client, workspace.run_id)

        assert response.status_code == 202
        assert len(llm.calls) == expected_calls
        assert generation["status"] == "GERADA"
        assert generation["completed_steps"] == 5
        assert generation["job"]["state"] == "CONCLUIDO"
        # Each step recorded once: nothing that finished before the crash ran again.
        steps = [step.step for step in workspace.read_metadata().steps]
        assert steps == ["statement", "code", "inputs", "testcases"]

    def test_resuming_after_the_last_model_step_calls_no_model(
        self, store, statement_response
    ) -> None:
        workspace = _started_question(store)

        class DyingRunner(FakeRunner):
            def compile(self, source, binary) -> None:
                raise ProcessKilled

        with pytest.raises(ProcessKilled):
            run_generation(
                workspace,
                to_constraints(QuestionDraft(**DRAFT_BODY)),
                2,
                FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS]),
                DyingRunner(),
            )
        llm = FakeLLM([])

        with server(llm) as client:
            assert client.post(f"/api/v1/questions/{workspace.run_id}/resume").status_code == 202
            generation = _generation(client, workspace.run_id)

        assert llm.calls == []
        assert generation["status"] == "GERADA"
        assert generation["job"]["state"] == "CONCLUIDO"

    def test_the_resume_answer_shows_the_job_running(self, store, statement_response) -> None:
        workspace = _crash_during(store, statement_response, survive=1)

        with server(FakeLLM([SOLUTION_SOURCE, INPUTS])) as client:
            body = client.post(f"/api/v1/questions/{workspace.run_id}/resume").json()

        # The answer is built before the background task runs.
        assert body["status"] == "GERANDO"
        assert body["job"]["state"] == "EM_ANDAMENTO"
        assert body["job"]["resumable"] is False

    def test_a_running_job_cannot_be_resumed(self, client, store) -> None:
        workspace = _started_question(store)

        response = client.post(f"/api/v1/questions/{workspace.run_id}/resume")

        assert response.status_code == 409
        assert "still running" in response.json()["detail"]
        assert client.fake_llm.calls == []

    def test_two_claims_on_one_interrupted_job_start_one(self, store, statement_response) -> None:
        # Two clicks on Retomar: the second claim finds the job already running.
        workspace = _crash_during(store, statement_response, survive=2)
        recover_interrupted_jobs(store)

        claim_resume(workspace)
        with pytest.raises(JobNotResumableError, match="still running"):
            claim_resume(RunWorkspace.open(store, workspace.run_id))

        assert workspace.read_job().state is JobState.EM_ANDAMENTO
        assert workspace.read_job().step == "inputs"

    @pytest.mark.parametrize("outcome", ["finished", "failed"])
    def test_an_ended_job_cannot_be_resumed(self, client, statement_response, outcome) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        if outcome == "failed":
            client.fake_runner.fail_compile = "boom"
        question_id = client.post("/api/v1/questions", json=DRAFT_BODY).json()["id"]
        calls = len(client.fake_llm.calls)

        response = client.post(f"/api/v1/questions/{question_id}/resume")

        assert response.status_code == 409
        assert len(client.fake_llm.calls) == calls

    def test_an_unknown_question_cannot_be_resumed(self, client) -> None:
        response = client.post("/api/v1/questions/20260101T000000Z-00000000/resume")
        assert response.status_code == 404


class TestRunsFromBeforeTheJob:
    """Questions created by the previous version have no job record at all."""

    def test_an_unfinished_one_reads_as_interrupted_and_resumes(
        self, store, statement_response
    ) -> None:
        workspace = RunWorkspace.create(store)
        workspace.write_json(DRAFT, DRAFT_BODY)
        llm = FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS])

        with server(llm) as client:
            before = _generation(client, workspace.run_id)
            resume = client.post(f"/api/v1/questions/{workspace.run_id}/resume")
            after = _generation(client, workspace.run_id)

        assert before["job"]["state"] == "INTERROMPIDO"
        assert resume.status_code == 202
        assert after["status"] == "GERADA"

    def test_one_that_failed_keeps_its_reason(self, store) -> None:
        workspace = RunWorkspace.create(store)
        workspace.write_json(DRAFT, DRAFT_BODY)
        workspace.write_json(FAILURE, {"reason": "Motivo antigo.", "error": "LLMError"})

        with server(FakeLLM([])) as client:
            generation = _generation(client, workspace.run_id)

        assert generation["job"]["state"] == "FALHOU"
        assert generation["failure_reason"] == "Motivo antigo."
