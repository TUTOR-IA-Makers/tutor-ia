"""The HTTP contract, including the status codes clients depend on."""

import pytest

from codeexpert.errors import LLMError
from codeexpert.llm import get_llm_client
from codeexpert.settings import reset_settings_cache

pytestmark = pytest.mark.integration

SOLUTION_SOURCE = "int main(void) { return 0; }"


def test_health_needs_no_configuration(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_reports_the_deployed_commit(client, monkeypatch) -> None:
    monkeypatch.setenv("CODEEXPERT_COMMIT_SHA", "a833fc4")
    reset_settings_cache()
    assert client.get("/health").json()["commit"] == "a833fc4"


def test_health_commit_is_null_outside_a_deploy(client, monkeypatch) -> None:
    monkeypatch.delenv("CODEEXPERT_COMMIT_SHA", raising=False)
    reset_settings_cache()
    assert client.get("/health").json()["commit"] is None


def test_config_never_returns_the_key(client) -> None:
    body = client.get("/config").json()
    assert body["api_key_configured"] is True
    assert "sk-test-not-a-real-key" not in str(body)


def test_root_redirects_to_the_docs(client) -> None:
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"


class TestStepByStep:
    def test_first_step_opens_a_run_and_returns_its_id(self, client, statement_response) -> None:
        client.fake_llm._responses = [statement_response]
        response = client.post("/gen_statement", json={"difficulty": "facil"})

        assert response.status_code == 200
        body = response.json()
        assert body["run_id"]
        assert body["name"] == "Soma de dois numeros"

    def test_steps_share_state_through_the_run_id(self, client, statement_response) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, '["1\\n2\\n"]']
        run_id = client.post("/gen_statement", json={}).json()["run_id"]

        assert client.post("/gen_code", json={"run_id": run_id}).status_code == 200
        assert client.post("/gen_inputs", json={"run_id": run_id, "qty": 1}).status_code == 200
        assert client.post("/gen_testcases", json={"run_id": run_id}).status_code == 200

        export = client.post("/export_moodle_xml_question", json={"run_id": run_id})
        assert export.status_code == 200
        assert export.json()["question_count"] == 1

    def test_two_runs_do_not_overwrite_each_other(self, client, statement_response) -> None:
        """The reason run ids exist: the old shared cache/ made this impossible."""
        client.fake_llm._responses = [
            statement_response,
            statement_response.replace("Soma de dois numeros", "Outro exercicio"),
        ]
        first = client.post("/gen_statement", json={}).json()
        second = client.post("/gen_statement", json={}).json()

        assert first["run_id"] != second["run_id"]
        assert first["name"] == "Soma de dois numeros"
        assert second["name"] == "Outro exercicio"


class TestErrorMapping:
    def test_unknown_run_is_404(self, client) -> None:
        response = client.post("/gen_code", json={"run_id": "20260918T120000Z-deadbeef"})
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_malformed_run_id_is_404_not_500(self, client) -> None:
        assert client.post("/gen_code", json={"run_id": "../../etc"}).status_code == 404

    def test_steps_out_of_order_are_409(self, client, statement_response) -> None:
        client.fake_llm._responses = [statement_response]
        run_id = client.post("/gen_statement", json={}).json()["run_id"]

        response = client.post("/gen_testcases", json={"run_id": run_id})
        assert response.status_code == 409
        assert "POST /gen_code" in response.json()["detail"]

    def test_unknown_difficulty_is_422(self, client) -> None:
        response = client.post("/gen_statement", json={"difficulty": "impossivel"})
        assert response.status_code == 422

    def test_quantity_out_of_range_is_422(self, client) -> None:
        response = client.post(
            "/gen_inputs", json={"run_id": "20260918T120000Z-deadbeef", "qty": 500}
        )
        assert response.status_code == 422

    def test_provider_failure_is_502_not_500(self, client) -> None:
        class BrokenLLM:
            def complete(self, *, system: str, user: str, temperature: float = 0.7) -> str:
                raise LLMError("provider exploded")

        client.app.dependency_overrides[get_llm_client] = BrokenLLM
        response = client.post("/gen_statement", json={})
        assert response.status_code == 502
        assert "provider exploded" in response.json()["detail"]


def test_create_question_runs_every_step(client, statement_response) -> None:
    client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, '["1\\n2\\n"]']
    response = client.post(
        "/create_question",
        json={"statement_request": {"difficulty": "facil"}, "qty": 1},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["run_id"]
    assert len(body["testcases"]) == 1
    assert body["export"]["question_count"] == 1


def test_create_question_failure_names_the_run_to_resume(
    client, statement_response, isolated_settings
) -> None:
    """A mid-pipeline failure keeps the run on disk; the client needs its id to resume it."""
    client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, '["1\\n2\\n"]']
    client.fake_runner.fail_compile = "solution.c:1:1: error: boom"

    response = client.post("/create_question", json={"statement_request": {}, "qty": 1})

    assert response.status_code == 422
    body = response.json()
    assert "boom" in body["detail"]
    assert (isolated_settings.workspace_root / body["run_id"] / "solution.c").exists()


def test_create_question_input_request_requires_a_run_id(client) -> None:
    response = client.post("/create_question", json={"input_request": {"qty": 5}})
    assert response.status_code == 422
