"""The question lifecycle over HTTP and through the pipeline. See docs/adr/0015.

Each request builds its own store from settings, so every read here goes back to
what was persisted, not to an object still held in memory.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from codeexpert.domain import Constraints, QuestionState
from codeexpert.errors import CompilationError, ExecutionError
from codeexpert.export import export_question
from codeexpert.generation import create_question, generate_testcases
from codeexpert.settings import get_settings
from codeexpert.store import LocalFilesystemStore
from codeexpert.workspace import RunWorkspace
from tests.conftest import FakeLLM, FakeRunner

pytestmark = pytest.mark.integration

SOLUTION_SOURCE = "int main(void) { return 0; }"
INPUTS_RESPONSE = '["1\\n2\\n", "10\\n20\\n"]'


def _generate(client: TestClient, statement_response: str) -> str:
    """Run the four generation steps, leaving the question one step from complete."""
    client.fake_llm._responses.extend([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    run_id = client.post("/gen_statement", json={}).json()["run_id"]
    assert client.post("/gen_code", json={"run_id": run_id}).status_code == 200
    assert client.post("/gen_inputs", json={"run_id": run_id, "qty": 2}).status_code == 200
    assert client.post("/gen_testcases", json={"run_id": run_id}).status_code == 200
    return run_id


def _complete(client: TestClient, statement_response: str) -> str:
    run_id = _generate(client, statement_response)
    assert client.post("/export_moodle_xml_question", json={"run_id": run_id}).status_code == 200
    return run_id


def _failed(client: TestClient, statement_response: str) -> str:
    client.fake_runner.fail_compile = "solution.c:1: error: expected ';'"
    client.fake_llm._responses.extend([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    response = client.post("/create_question", json={"qty": 2})
    assert response.status_code == 422
    client.fake_runner.fail_compile = None
    return response.json()["run_id"]


def _state_on_disk(run_id: str) -> QuestionState:
    """Read the state with a fresh store, the way another process would."""
    return LocalFilesystemStore(get_settings().workspace_root).get_state(run_id)


# ── The valid path ────────────────────────────────────────────────────────────


def test_a_question_is_gerando_until_step_5_then_gerada(
    client: TestClient, statement_response: str
) -> None:
    run_id = _generate(client, statement_response)
    assert _state_on_disk(run_id) is QuestionState.GERANDO

    client.post("/export_moodle_xml_question", json={"run_id": run_id})

    body = client.get(f"/questions/{run_id}").json()
    assert body["state"] == "GERADA"


def test_approving_a_gerada_question_is_persisted_and_read_back(
    client: TestClient, statement_response: str
) -> None:
    run_id = _complete(client, statement_response)

    response = client.post(f"/questions/{run_id}/approve")

    assert response.status_code == 200
    assert response.json() == {"run_id": run_id, "state": "APROVADA"}
    assert client.get(f"/questions/{run_id}").json()["state"] == "APROVADA"


def test_rejecting_a_gerada_question_is_persisted(
    client: TestClient, statement_response: str
) -> None:
    run_id = _complete(client, statement_response)

    assert client.post(f"/questions/{run_id}/reject").json()["state"] == "REJEITADA"
    assert client.get(f"/questions/{run_id}").json()["state"] == "REJEITADA"


def test_create_question_reports_the_state(client: TestClient, statement_response: str) -> None:
    client.fake_llm._responses.extend([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    body = client.post("/create_question", json={"qty": 2}).json()
    assert body["state"] == "GERADA"


# ── Refused transitions are 409, and change nothing ───────────────────────────


def test_approving_a_question_that_failed_verification_is_409(
    client: TestClient, statement_response: str
) -> None:
    run_id = _failed(client, statement_response)
    assert _state_on_disk(run_id) is QuestionState.FALHOU_VERIFICACAO

    response = client.post(f"/questions/{run_id}/approve")

    assert response.status_code == 409
    assert "failed verification cannot be approved" in response.json()["detail"]
    assert _state_on_disk(run_id) is QuestionState.FALHOU_VERIFICACAO


def test_a_question_that_failed_verification_can_be_rejected(
    client: TestClient, statement_response: str
) -> None:
    run_id = _failed(client, statement_response)
    response = client.post(f"/questions/{run_id}/reject")
    assert response.status_code == 200
    assert response.json()["state"] == "REJEITADA"


def test_approving_a_question_still_in_generation_is_409(
    client: TestClient, statement_response: str
) -> None:
    run_id = _generate(client, statement_response)

    response = client.post(f"/questions/{run_id}/approve")

    assert response.status_code == 409
    assert "is GERANDO and cannot become APROVADA" in response.json()["detail"]
    assert _state_on_disk(run_id) is QuestionState.GERANDO


@pytest.mark.parametrize(
    ("first", "second"),
    [("approve", "approve"), ("approve", "reject"), ("reject", "approve"), ("reject", "reject")],
)
def test_a_reviewed_question_is_final(
    client: TestClient, statement_response: str, first: str, second: str
) -> None:
    run_id = _complete(client, statement_response)
    final = client.post(f"/questions/{run_id}/{first}").json()["state"]

    response = client.post(f"/questions/{run_id}/{second}")

    assert response.status_code == 409
    assert f"{final} is final" in response.json()["detail"]
    assert client.get(f"/questions/{run_id}").json()["state"] == final


def test_reviewing_an_unknown_question_is_404(client: TestClient) -> None:
    assert client.post("/questions/20260918T120000Z-deadbeef/approve").status_code == 404
    assert client.post("/questions/not-a-run-id/reject").status_code == 404


# ── What the pipeline does to the state ───────────────────────────────────────


def test_a_timeout_also_fails_verification(
    workspace: RunWorkspace, statement_response: str
) -> None:
    llm = FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    with pytest.raises(ExecutionError):
        create_question(workspace, Constraints(), 2, llm, FakeRunner(timeout_on="1\n2\n"))
    assert workspace.state is QuestionState.FALHOU_VERIFICACAO


def test_retrying_verification_returns_to_generation_and_can_succeed(
    workspace: RunWorkspace, statement_response: str, tmp_path: Path
) -> None:
    llm = FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    with pytest.raises(CompilationError):
        create_question(workspace, Constraints(), 2, llm, FakeRunner(fail_compile="boom"))
    assert workspace.state is QuestionState.FALHOU_VERIFICACAO

    generate_testcases(workspace, FakeRunner())
    assert workspace.state is QuestionState.GERANDO

    export_question(workspace, output_dir=tmp_path / "out")
    assert workspace.state is QuestionState.GERADA


class _NoCompiler(FakeRunner):
    def compile(self, source: Path, binary: Path) -> None:
        raise ExecutionError("'gcc' was not found on PATH.")


def test_a_missing_compiler_is_not_the_questions_fault(
    workspace: RunWorkspace, statement_response: str
) -> None:
    llm = FakeLLM([statement_response, SOLUTION_SOURCE, INPUTS_RESPONSE])
    with pytest.raises(ExecutionError):
        create_question(workspace, Constraints(), 2, llm, _NoCompiler())
    assert workspace.state is QuestionState.GERANDO


def test_finishing_step_5_again_keeps_the_review(
    client: TestClient, statement_response: str
) -> None:
    run_id = _complete(client, statement_response)
    client.post(f"/questions/{run_id}/approve")

    assert client.post("/export_moodle_xml_question", json={"run_id": run_id}).status_code == 200
    assert client.get(f"/questions/{run_id}").json()["state"] == "APROVADA"


def test_a_failed_reverification_of_a_reviewed_question_keeps_its_state(
    client: TestClient, statement_response: str
) -> None:
    run_id = _complete(client, statement_response)
    client.post(f"/questions/{run_id}/approve")

    client.fake_runner.fail_compile = "boom"
    assert client.post("/gen_testcases", json={"run_id": run_id}).status_code == 422
    assert _state_on_disk(run_id) is QuestionState.APROVADA
