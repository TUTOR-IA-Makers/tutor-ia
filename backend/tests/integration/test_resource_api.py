"""The resource API the web client calls: POST → 202 → poll → read.

Starlette's TestClient runs background tasks before `post()` returns, so the
first poll already sees the finished job. The loop is kept anyway: it is the
client's contract, and it must terminate.
"""

import pytest

from codeexpert.errors import LLMError
from codeexpert.execution import get_code_runner
from codeexpert.llm import get_llm_client
from codeexpert.store import LocalFilesystemStore
from codeexpert.workspace import DRAFT, RunWorkspace

pytestmark = pytest.mark.integration

SOLUTION_SOURCE = "int main(void) { return 0; }"
INPUTS = '["1\\n2\\n", "3\\n4\\n"]'

DRAFT_BODY = {
    "content_id": "condicionais",
    "difficulty_min": 1200,
    "difficulty_max": 1600,
    "test_case_count": 2,
    "test_case_hints": None,
    "context": "Tarifa de estacionamento",
    "structures": {"required": ["if"], "allowed": ["else"], "forbidden": ["for"]},
}


def _poll(client, question_id: str, attempts: int = 10) -> dict:
    for _ in range(attempts):
        body = client.get(f"/api/v1/questions/{question_id}/generation").json()
        if body["status"] != "GERANDO":
            return body
    raise AssertionError(f"Generation of {question_id} never finished")


def _create(client) -> str:
    response = client.post("/api/v1/questions", json=DRAFT_BODY)
    assert response.status_code == 202
    return response.json()["id"]


class TestSuccess:
    @pytest.fixture
    def question_id(self, client, statement_response) -> str:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        return _create(client)

    def test_generation_finishes_as_generated(self, client, question_id) -> None:
        generation = _poll(client, question_id)

        assert generation == {
            "question_id": question_id,
            "run_id": question_id,
            "status": "GERADA",
            "completed_steps": 5,
            "failure_reason": None,
        }

    def test_question_carries_the_executed_test_cases(self, client, question_id) -> None:
        _poll(client, question_id)
        body = client.get(f"/api/v1/questions/{question_id}").json()

        assert body["status"] == "GERADA"
        assert body["title"] == "Soma de dois numeros"
        assert body["solution"] == SOLUTION_SOURCE
        # Rule 4: the expected output is what running the solution printed.
        assert body["test_cases"] == [
            {
                "id": "caso-1",
                "input": "1\n2\n",
                "expected_output": "out:1\n2\n",
                "actual_output": None,
                "passed": None,
            },
            {
                "id": "caso-2",
                "input": "3\n4\n",
                "expected_output": "out:3\n4\n",
                "actual_output": None,
                "passed": None,
            },
        ]
        assert body["test_case_count"] == 2

    def test_question_echoes_the_draft_and_invents_nothing(self, client, question_id) -> None:
        _poll(client, question_id)
        body = client.get(f"/api/v1/questions/{question_id}").json()

        assert body["content_id"] == "condicionais"
        assert (body["difficulty_min"], body["difficulty_max"]) == (1200, 1600)
        assert body["description"] == "Tarifa de estacionamento"
        assert body["structures"] == DRAFT_BODY["structures"]
        assert body["constraints"] == []
        assert body["compilation"] is None
        assert body["statement"]["example"] is None
        assert body["failure_reason"] is None

    def test_constraints_from_the_draft_reach_the_run(
        self, client, question_id, isolated_settings
    ) -> None:
        _poll(client, question_id)
        store = LocalFilesystemStore(isolated_settings.workspace_root)
        metadata = RunWorkspace.open(store, question_id).read_metadata()

        assert metadata.constraints is not None
        assert metadata.constraints.axis == "controle de fluxo"
        assert metadata.constraints.difficulty == "medio"
        assert metadata.constraints.can_has_repetition is False
        assert metadata.input_quantity == 2

    def test_the_rpc_route_still_serves_the_same_run(self, client, question_id) -> None:
        _poll(client, question_id)
        assert client.get(f"/questions/{question_id}").status_code == 200


class TestFailure:
    def test_compilation_failure_is_reported_not_generated(
        self, client, statement_response, isolated_settings
    ) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        client.fake_runner.fail_compile = "solution.c:1:1: error: boom"
        question_id = _create(client)

        generation = _poll(client, question_id)

        assert generation["status"] == "FALHOU_VERIFICACAO"
        assert generation["completed_steps"] == 3
        assert generation["failure_reason"] == (
            "A solução gerada não compilou. Gere a questão de novo."
        )
        store = LocalFilesystemStore(isolated_settings.workspace_root)
        assert not store.is_complete(question_id)

    def test_failed_question_is_readable_with_its_reason(self, client, statement_response) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        client.fake_runner.fail_compile = "solution.c:1:1: error: boom"
        question_id = _create(client)
        _poll(client, question_id)

        body = client.get(f"/api/v1/questions/{question_id}").json()

        assert body["status"] == "FALHOU_VERIFICACAO"
        assert body["test_cases"] == []
        assert body["solution"] == SOLUTION_SOURCE
        assert "não compilou" in body["failure_reason"]

    def test_failure_reason_has_no_internal_detail(self, client) -> None:
        class BrokenLLM:
            def complete(self, **_: object) -> str:
                raise LLMError("provider exploded with sk-XXXX in the body")

        client.app.dependency_overrides[get_llm_client] = BrokenLLM
        question_id = _create(client)

        generation = _poll(client, question_id)

        assert generation["status"] == "FALHOU_VERIFICACAO"
        assert generation["completed_steps"] == 0
        assert "exploded" not in generation["failure_reason"]
        assert "Traceback" not in generation["failure_reason"]

    def test_an_unexpected_error_still_ends_the_generation(
        self, client, statement_response
    ) -> None:
        class CrashingRunner:
            def compile(self, *_: object) -> None:
                raise RuntimeError("not a CodeExpertError")

        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        client.app.dependency_overrides[get_code_runner] = CrashingRunner
        question_id = _create(client)

        generation = _poll(client, question_id)

        assert generation["status"] == "FALHOU_VERIFICACAO"
        assert generation["failure_reason"] == (
            "A geração parou antes de terminar. Gere a questão de novo."
        )


class TestWhileGenerating:
    def test_a_started_question_reads_as_generating(self, client, isolated_settings) -> None:
        # What a poll sees between the 202 and the end of the job.
        store = LocalFilesystemStore(isolated_settings.workspace_root)
        workspace = RunWorkspace.create(store)
        workspace.write_json(DRAFT, DRAFT_BODY)

        generation = client.get(f"/api/v1/questions/{workspace.run_id}/generation").json()
        question = client.get(f"/api/v1/questions/{workspace.run_id}").json()

        assert generation["status"] == "GERANDO"
        assert generation["completed_steps"] == 0
        assert question["status"] == "GERANDO"
        assert question["solution"] is None
        assert question["test_cases"] == []
        assert question["test_case_count"] == 2


class TestRejections:
    @pytest.mark.parametrize(
        "change",
        [
            {"content_id": "nao-existe"},
            {"difficulty_min": 2000, "difficulty_max": 1000},
            {"test_case_count": 0},
            {"structures": {"required": ["if"], "allowed": [], "forbidden": ["if"]}},
            {"structures": {"required": ["lacos"], "allowed": [], "forbidden": []}},
        ],
        ids=["content", "difficulty", "count", "conflict", "structure"],
    )
    def test_invalid_draft_is_422_and_starts_nothing(
        self, client, change, isolated_settings
    ) -> None:
        response = client.post("/api/v1/questions", json={**DRAFT_BODY, **change})

        assert response.status_code == 422
        assert client.fake_llm.calls == []
        root = isolated_settings.workspace_root
        assert not root.exists() or not any(root.iterdir())

    def test_unknown_question_is_404(self, client) -> None:
        assert client.get("/api/v1/questions/20260101T000000Z-00000000").status_code == 404
        assert (
            client.get("/api/v1/questions/20260101T000000Z-00000000/generation").status_code == 404
        )

    def test_malformed_id_is_404(self, client) -> None:
        assert client.get("/api/v1/questions/..%2F..%2Fetc").status_code == 404

    def test_a_run_started_by_the_rpc_routes_is_not_a_question(
        self, client, statement_response
    ) -> None:
        client.fake_llm._responses = [statement_response]
        run_id = client.post("/gen_statement", json={}).json()["run_id"]

        assert client.get(f"/api/v1/questions/{run_id}").status_code == 404
        assert client.get(f"/api/v1/questions/{run_id}/generation").status_code == 404
