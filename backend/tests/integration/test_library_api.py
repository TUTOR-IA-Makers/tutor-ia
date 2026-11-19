"""`GET /api/v1/questions`: the library over HTTP, with the front-end's parameters (G1-5).

Questions are seeded straight into the store with distinct creation dates, so
the order under test does not depend on how fast the suite runs.
"""

import pytest

from codeexpert.domain import QuestionState
from codeexpert.generation.job import recover_interrupted_jobs, start_job
from codeexpert.store import LocalFilesystemStore
from codeexpert.workspace import DRAFT, STATEMENT, RunWorkspace

pytestmark = pytest.mark.integration


@pytest.fixture
def seed(isolated_settings):
    store = LocalFilesystemStore(isolated_settings.workspace_root)

    def _seed(
        *,
        day: int,
        content_id: str = "condicionais",
        rating: tuple[int, int] = (1200, 1600),
        state: QuestionState = QuestionState.GERADA,
        title: str = "Soma",
        text: str = "Leia dois inteiros.",
    ) -> str:
        workspace = RunWorkspace.create(store)
        # What POST /api/v1/questions records: a job, running until it ends.
        start_job(workspace)
        workspace.write_metadata(
            workspace.read_metadata().model_copy(
                update={"created_at": f"2026-10-{day:02d}T09:30:00+00:00"}
            )
        )
        workspace.write_json(
            DRAFT,
            {
                "content_id": content_id,
                "difficulty_min": rating[0],
                "difficulty_max": rating[1],
                "test_case_count": 3,
            },
        )
        workspace.write_json(STATEMENT, {"name": title, "statement": text})
        if state is not QuestionState.GERANDO:
            assert store.set_state(workspace.run_id, QuestionState.GERANDO, state)
        return workspace.run_id

    return _seed


@pytest.fixture
def bank(seed) -> dict[str, str]:
    return {
        "cond": seed(day=1, content_id="condicionais", rating=(500, 900)),
        "rep": seed(day=5, content_id="repeticao", state=QuestionState.APROVADA, text="Tabuada"),
        "vet": seed(day=3, content_id="vetores", rating=(2000, 2300), title="Maior elemento"),
        "gen": seed(day=7, content_id="funcoes", state=QuestionState.GERANDO),
    }


def _ids(client, **params) -> list[str]:
    response = client.get("/api/v1/questions", params=params)
    assert response.status_code == 200, response.text
    return [item["id"] for item in response.json()["items"]]


def test_an_empty_bank_answers_an_empty_page(client) -> None:
    response = client.get("/api/v1/questions")

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "page_size": 20}


def test_lists_every_state_newest_first(client, bank) -> None:
    assert _ids(client) == [bank["gen"], bank["rep"], bank["vet"], bank["cond"]]


def test_items_have_the_shape_the_front_end_validates(client, bank) -> None:
    item = client.get("/api/v1/questions", params={"content": "vetores"}).json()["items"][0]

    # frontend/src/services/http/dto.ts, questionSummaryDto.
    assert item == {
        "id": bank["vet"],
        "code": bank["vet"],
        "title": "Maior elemento",
        "description": "",
        "content_id": "vetores",
        "difficulty_min": 2000,
        "difficulty_max": 2300,
        "status": "GERADA",
        "test_case_count": 3,
    }


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"content": "repeticao"}, ["rep"]),
        ({"axis": "controle de fluxo"}, ["rep", "cond"]),
        ({"difficulty": "dificil"}, ["vet"]),
        ({"status": "APROVADA"}, ["rep"]),
        ({"q": "TABUADA"}, ["rep"]),
        ({"axis": "controle de fluxo", "difficulty": "muito-facil"}, ["cond"]),
        ({"status": "GERADA", "q": "maior"}, ["vet"]),
    ],
)
def test_filters(client, bank, params, expected) -> None:
    assert _ids(client, **params) == [bank[key] for key in expected]


def test_no_match_is_an_empty_page(client, bank) -> None:
    body = client.get("/api/v1/questions", params={"status": "REJEITADA"}).json()

    assert (body["items"], body["total"]) == ([], 0)


def test_pages(client, bank) -> None:
    first = client.get("/api/v1/questions", params={"page_size": 3}).json()
    second = client.get("/api/v1/questions", params={"page_size": 3, "page": 2}).json()

    assert [item["id"] for item in first["items"]] == [bank["gen"], bank["rep"], bank["vet"]]
    assert [item["id"] for item in second["items"]] == [bank["cond"]]
    assert first["total"] == second["total"] == 4


def test_a_page_past_the_end_is_not_a_server_error(client, bank) -> None:
    response = client.get("/api/v1/questions", params={"page": 50})

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 4, "page": 50, "page_size": 20}


def test_rpc_runs_are_not_listed(client, bank, isolated_settings) -> None:
    RunWorkspace.create(LocalFilesystemStore(isolated_settings.workspace_root))

    assert len(_ids(client)) == 4


@pytest.mark.parametrize(
    "params",
    [
        {"content": "desconhecido"},
        {"difficulty": "medium"},
        {"status": "aprovada"},
        {"axis": "loops"},
        {"page": 0},
        {"page_size": 500},
    ],
)
def test_invalid_parameters_are_a_422(client, params) -> None:
    assert client.get("/api/v1/questions", params=params).status_code == 422


def test_an_interrupted_generation_reads_the_same_in_the_list_and_on_its_page(
    client, seed, isolated_settings
) -> None:
    question = seed(day=1, state=QuestionState.GERANDO)
    # What the next server start does to a job the previous process left running.
    recover_interrupted_jobs(LocalFilesystemStore(isolated_settings.workspace_root))

    [item] = client.get("/api/v1/questions").json()["items"]
    page = client.get(f"/api/v1/questions/{question}").json()

    assert item["status"] == page["status"] == "FALHOU_VERIFICACAO"
    assert _ids(client, status="GERANDO") == []
