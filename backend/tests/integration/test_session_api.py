"""Sign-in, accounts, the session cookie, and what a session gates.

The contract is docs/architecture/frontend-integracao.md §5.
"""

import pytest
from fastapi.testclient import TestClient

from codeexpert.api.deps import get_current_teacher
from codeexpert.settings import reset_settings_cache
from tests.conftest import TEST_TEACHER
from tests.integration.test_resource_api import DRAFT_BODY, INPUTS, SOLUTION_SOURCE, _create, _poll

pytestmark = pytest.mark.integration

ACCOUNT = {
    "name": "Ana Lima",
    "email": "ana@example.edu",
    "password": "uma senha longa",
    "invite_code": "ABC-123",
}
LOGIN = {"email": ACCOUNT["email"], "password": ACCOUNT["password"]}


def _signup(client: TestClient, **changes: str):
    return client.post("/api/v1/accounts", json={**ACCOUNT, **changes})


class TestAccounts:
    def test_creating_an_account_opens_a_session(self, anonymous_client) -> None:
        response = _signup(anonymous_client)

        assert response.status_code == 201
        cookie = response.headers["set-cookie"].lower()
        for attribute in ("httponly", "secure", "samesite=lax", "path=/"):
            assert attribute in cookie
        assert anonymous_client.get("/api/v1/session").json() == {
            "name": "Ana Lima",
            "department": "",
        }

    @pytest.mark.parametrize(
        "changes",
        [
            {"password": "curta"},
            {"invite_code": "?"},
            {"email": "nao-e-email"},
        ],
    )
    def test_every_refusal_is_the_same_answer(self, anonymous_client, changes) -> None:
        _signup(anonymous_client)
        anonymous_client.cookies.clear()
        taken = _signup(anonymous_client)
        refused = _signup(anonymous_client, **changes)

        assert taken.status_code == refused.status_code == 400
        assert taken.json() == refused.json()
        assert "set-cookie" not in refused.headers


class TestSignIn:
    @pytest.fixture(autouse=True)
    def account(self, anonymous_client) -> None:
        _signup(anonymous_client)
        anonymous_client.post("/api/v1/session/logout")

    def test_signing_out_ends_the_session(self, anonymous_client) -> None:
        assert anonymous_client.get("/api/v1/session").status_code == 401

    def test_the_right_password_opens_a_session(self, anonymous_client) -> None:
        response = anonymous_client.post(
            "/api/v1/session", json={**LOGIN, "email": " ANA@example.edu "}
        )
        assert response.status_code == 204
        assert anonymous_client.get("/api/v1/session").json()["name"] == "Ana Lima"

    def test_unknown_email_and_wrong_password_are_the_same_answer(self, anonymous_client) -> None:
        wrong = anonymous_client.post("/api/v1/session", json={**LOGIN, "password": "x" * 12})
        unknown = anonymous_client.post(
            "/api/v1/session", json={**LOGIN, "email": "ninguem@example.edu"}
        )
        assert wrong.status_code == unknown.status_code == 401
        assert wrong.json() == unknown.json()

    def test_too_many_failures_is_429_with_retry_after(self, anonymous_client) -> None:
        for _ in range(10):
            anonymous_client.post("/api/v1/session", json={**LOGIN, "password": "x" * 12})

        blocked = anonymous_client.post("/api/v1/session", json=LOGIN)

        assert blocked.status_code == 429
        assert int(blocked.headers["retry-after"]) > 0

    def test_a_forged_cookie_is_not_a_session(self, anonymous_client) -> None:
        anonymous_client.cookies.set("session", "inventado", domain="testserver")
        assert anonymous_client.get("/api/v1/session").status_code == 401


class TestGate:
    @pytest.mark.parametrize(
        ("method", "path"),
        [
            ("get", "/api/v1/questions"),
            ("get", "/api/v1/questions/20261127T120000Z-a1b2c3d4"),
            ("post", "/api/v1/questions"),
            ("post", "/api/v1/exports/moodle"),
        ],
    )
    def test_questions_need_a_session(self, anonymous_client, method, path) -> None:
        response = anonymous_client.request(method, path, json=DRAFT_BODY)
        assert response.status_code == 401

    def test_a_write_without_the_web_client_header_is_403(self, anonymous_client) -> None:
        response = anonymous_client.post(
            "/api/v1/accounts", json=ACCOUNT, headers={"X-Requested-With": "outro"}
        )
        assert response.status_code == 403

    def test_the_catalog_and_health_stay_public(self, anonymous_client) -> None:
        assert anonymous_client.get("/health").status_code == 200


class TestOwnership:
    OTHER = TEST_TEACHER.__class__(id="teacher-other", name="Outra", email="outra@example.edu")

    @pytest.fixture
    def question_id(self, client, statement_response) -> str:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        question_id = _create(client)
        _poll(client, question_id)
        return question_id

    def test_another_teacher_neither_lists_nor_opens_it(self, client, question_id) -> None:
        client.app.dependency_overrides[get_current_teacher] = lambda: self.OTHER

        assert client.get("/api/v1/questions").json()["total"] == 0
        assert client.get(f"/api/v1/questions/{question_id}").status_code == 404
        assert client.post(f"/api/v1/questions/{question_id}/approve").status_code == 404

    def test_the_owner_still_sees_it(self, client, question_id) -> None:
        assert client.get("/api/v1/questions").json()["total"] == 1

    def test_the_owner_is_not_taken_from_the_body(self, client, statement_response) -> None:
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        response = client.post("/api/v1/questions", json={**DRAFT_BODY, "owner": self.OTHER.id})
        client.app.dependency_overrides[get_current_teacher] = lambda: self.OTHER
        assert client.get(f"/api/v1/questions/{response.json()['id']}").status_code == 404


class TestDailyLimit:
    def test_past_the_limit_is_429_with_retry_after(
        self, client, statement_response, monkeypatch
    ) -> None:
        monkeypatch.setenv("CODEEXPERT_DAILY_GENERATION_LIMIT", "1")
        reset_settings_cache()
        client.fake_llm._responses = [statement_response, SOLUTION_SOURCE, INPUTS]
        _create(client)

        response = client.post("/api/v1/questions", json=DRAFT_BODY)

        assert response.status_code == 429
        assert 0 < int(response.headers["retry-after"]) <= 24 * 3600
