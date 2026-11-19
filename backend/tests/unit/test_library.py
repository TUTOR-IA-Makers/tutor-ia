"""Which questions the library lists, in what order, one page at a time (G1-5)."""

import json

import pytest
from pydantic import ValidationError

from codeexpert.api.library import PENDING_TITLE, DifficultyBand, LibraryQuery, list_questions
from codeexpert.domain import (
    ContentAxis,
    Difficulty,
    JobRecord,
    JobState,
    QuestionState,
    RunMetadata,
)
from codeexpert.store import RunListing
from codeexpert.workspace import DRAFT, FAILURE, META, STATEMENT, TESTCASES


def _listing(
    run_id: str,
    *,
    day: int = 1,
    content_id: str = "condicionais",
    rating: tuple[int, int] = (1200, 1600),
    state: QuestionState = QuestionState.GERADA,
    title: str | None = "Soma de dois números",
    text: str = "Leia dois inteiros e escreva a soma.",
    context: str | None = None,
    cases: int | None = 2,
    job: JobState | None = None,
) -> RunListing:
    draft = {
        "content_id": content_id,
        "difficulty_min": rating[0],
        "difficulty_max": rating[1],
        "test_case_count": 5,
        "context": context,
    }
    meta = RunMetadata(run_id=run_id, created_at=f"2026-10-{day:02d}T12:00:00+00:00")
    artifacts = {DRAFT: json.dumps(draft), META: meta.model_dump_json()}
    if title is not None:
        artifacts[STATEMENT] = json.dumps({"name": title, "statement": text})
    if cases is not None:
        testcases = [{"input": str(i), "output": str(i)} for i in range(cases)]
        artifacts[TESTCASES] = json.dumps({"testcases": testcases})
    record = JobRecord(state=job, updated_at="2026-10-01T12:00:00+00:00") if job else None
    return RunListing(run_id, state, artifacts, record)


def _status(listing: RunListing) -> QuestionState:
    [item] = list_questions([listing], LibraryQuery()).items
    return item.status


def _ids(listings: list[RunListing], **query: object) -> list[str]:
    return [item.id for item in list_questions(listings, LibraryQuery(**query)).items]


class TestWithoutFilters:
    def test_lists_every_question_newest_first(self) -> None:
        listings = [_listing("old", day=1), _listing("new", day=20), _listing("mid", day=10)]

        page = list_questions(listings, LibraryQuery())

        assert [item.id for item in page.items] == ["new", "mid", "old"]
        assert (page.total, page.page, page.page_size) == (3, 1, 20)

    def test_no_questions_is_an_empty_page(self) -> None:
        page = list_questions([], LibraryQuery())

        assert page.items == []
        assert page.total == 0

    def test_runs_without_a_draft_are_not_questions(self) -> None:
        rpc_run = RunListing("rpc", QuestionState.GERADA, {STATEMENT: '{"name": "x"}'})

        assert _ids([rpc_run, _listing("api")]) == ["api"]

    def test_a_damaged_run_is_left_out_instead_of_failing_the_list(self) -> None:
        broken = RunListing("broken", QuestionState.GERADA, {DRAFT: "{not json"})

        assert _ids([broken, _listing("fine")]) == ["fine"]

    def test_the_summary_carries_what_the_card_shows(self) -> None:
        listing = _listing("q1", content_id="vetores", rating=(500, 900), context="Notas")

        [item] = list_questions([listing], LibraryQuery()).items

        assert item.model_dump() == {
            "id": "q1",
            "code": "q1",
            "title": "Soma de dois números",
            "description": "Notas",
            "content_id": "vetores",
            "difficulty_min": 500,
            "difficulty_max": 900,
            "status": QuestionState.GERADA,
            "test_case_count": 2,
        }

    def test_a_question_still_generating_has_a_placeholder_title(self) -> None:
        listing = _listing(
            "q1", state=QuestionState.GERANDO, title=None, cases=None, job=JobState.EM_ANDAMENTO
        )

        [item] = list_questions([listing], LibraryQuery()).items

        assert item.title == PENDING_TITLE
        # Before step 4 the count is what the teacher asked for.
        assert item.test_case_count == 5


class TestAStoppedGeneration:
    """The card shows the state GET /api/v1/questions/{id} reports (G0-8)."""

    def test_a_running_job_is_still_gerando(self) -> None:
        listing = _listing("q1", state=QuestionState.GERANDO, job=JobState.EM_ANDAMENTO)

        assert _status(listing) is QuestionState.GERANDO

    @pytest.mark.parametrize("job", [JobState.FALHOU, JobState.INTERROMPIDO])
    def test_a_failed_or_interrupted_job_reads_as_failed(self, job: JobState) -> None:
        listing = _listing("q1", state=QuestionState.GERANDO, job=job)

        assert _status(listing) is QuestionState.FALHOU_VERIFICACAO

    def test_a_run_from_before_jobs_reads_as_stopped(self) -> None:
        # No job record, so nothing can still be generating it.
        listing = _listing("q1", state=QuestionState.GERANDO)

        assert _status(listing) is QuestionState.FALHOU_VERIFICACAO

    def test_a_run_from_before_jobs_that_failed_reads_as_failed(self) -> None:
        listing = _listing("q1", state=QuestionState.GERANDO)
        listing.artifacts[FAILURE] = '{"reason": "x", "error": "LLMError"}'

        assert _status(listing) is QuestionState.FALHOU_VERIFICACAO

    def test_a_reviewed_question_keeps_its_state_whatever_the_job_says(self) -> None:
        listing = _listing("q1", state=QuestionState.APROVADA, job=JobState.INTERROMPIDO)

        assert _status(listing) is QuestionState.APROVADA

    def test_filtering_by_gerando_leaves_out_stopped_generations(self) -> None:
        listings = [
            _listing("running", state=QuestionState.GERANDO, job=JobState.EM_ANDAMENTO),
            _listing("stopped", state=QuestionState.GERANDO, job=JobState.INTERROMPIDO),
        ]

        assert _ids(listings, status=QuestionState.GERANDO) == ["running"]
        assert _ids(listings, status=QuestionState.FALHOU_VERIFICACAO) == ["stopped"]


class TestFilters:
    @pytest.fixture
    def listings(self) -> list[RunListing]:
        return [
            _listing("cond", day=1, content_id="condicionais", rating=(500, 900)),
            _listing("rep", day=2, content_id="repeticao", rating=(1900, 2300)),
            _listing(
                "vet",
                day=3,
                content_id="vetores",
                rating=(1400, 1800),
                state=QuestionState.APROVADA,
            ),
            _listing("rec", day=4, content_id="recursao", state=QuestionState.REJEITADA),
        ]

    def test_by_content(self, listings) -> None:
        assert _ids(listings, content="repeticao") == ["rep"]

    def test_by_axis_groups_contents(self, listings) -> None:
        assert _ids(listings, axis=ContentAxis.CONTROLE_FLUXO) == ["rep", "cond"]

    def test_by_state(self, listings) -> None:
        assert _ids(listings, status=QuestionState.APROVADA) == ["vet"]

    def test_by_difficulty_band(self, listings) -> None:
        assert _ids(listings, difficulty=DifficultyBand.MUITO_FACIL) == ["cond"]

    def test_difficulty_matches_any_overlap(self, listings) -> None:
        # "rec" is 1200-1600: fácil (to 1350) and médio (from 1351) both list it.
        assert _ids(listings, difficulty=DifficultyBand.FACIL) == ["rec"]
        assert _ids(listings, difficulty=DifficultyBand.MEDIO) == ["rec", "vet"]

    def test_difficulty_band_edges(self) -> None:
        at_edge = _listing("edge", rating=(950, 950))

        assert _ids([at_edge], difficulty=DifficultyBand.MUITO_FACIL) == ["edge"]
        assert _ids([at_edge], difficulty=DifficultyBand.FACIL) == []

    def test_filters_combine(self, listings) -> None:
        both = {"axis": ContentAxis.ESTRUTURAS_PONTEIROS, "status": QuestionState.APROVADA}

        assert _ids(listings, **both) == ["vet"]
        assert _ids(listings, **both, difficulty=DifficultyBand.MUITO_DIFICIL) == []

    def test_no_match_is_an_empty_page(self, listings) -> None:
        page = list_questions(listings, LibraryQuery(content="ponteiros"))

        assert (page.items, page.total) == ([], 0)

    def test_every_band_has_a_level(self) -> None:
        assert {band.level for band in DifficultyBand} == set(Difficulty)


class TestSearch:
    @pytest.fixture
    def listings(self) -> list[RunListing]:
        return [
            _listing("tarifa", day=1, title="Tarifa", text="Calcule o preço do estacionamento."),
            _listing("media", day=2, title="Média", text="Leia três notas.", context="Avaliação"),
        ]

    def test_finds_words_in_the_statement(self, listings) -> None:
        assert _ids(listings, q="estacionamento") == ["tarifa"]

    def test_finds_words_in_the_title_and_context(self, listings) -> None:
        assert _ids(listings, q="média") == ["media"]
        assert _ids(listings, q="avaliação") == ["media"]

    def test_ignores_case_and_accents(self, listings) -> None:
        assert _ids(listings, q="PRECO") == ["tarifa"]
        assert _ids(listings, q="media") == ["media"]

    def test_every_word_must_appear(self, listings) -> None:
        assert _ids(listings, q="leia notas") == ["media"]
        assert _ids(listings, q="leia estacionamento") == []

    def test_combines_with_filters(self, listings) -> None:
        assert _ids(listings, q="leia", status=QuestionState.APROVADA) == []

    def test_blank_search_is_no_search(self) -> None:
        assert LibraryQuery(q="   ").q is None


class TestPagination:
    @pytest.fixture
    def listings(self) -> list[RunListing]:
        return [_listing(f"q{day:02d}", day=day) for day in range(1, 6)]

    def test_pages_follow_the_order(self, listings) -> None:
        assert _ids(listings, page=1, page_size=2) == ["q05", "q04"]
        assert _ids(listings, page=2, page_size=2) == ["q03", "q02"]
        assert _ids(listings, page=3, page_size=2) == ["q01"]

    def test_a_page_past_the_end_is_empty_and_keeps_the_total(self, listings) -> None:
        page = list_questions(listings, LibraryQuery(page=9, page_size=2))

        assert (page.items, page.total, page.page) == ([], 5, 9)

    def test_the_same_instant_is_ordered_by_id_so_pages_never_overlap(self) -> None:
        listings = [_listing(run_id, day=1) for run_id in ("b", "c", "a")]

        assert _ids(listings, page=1, page_size=2) + _ids(listings, page=2, page_size=2) == [
            "c",
            "b",
            "a",
        ]


class TestQueryValidation:
    @pytest.mark.parametrize(
        "query",
        [
            {"content": "desconhecido"},
            {"difficulty": "muito facil"},
            {"status": "aprovada"},
            {"page": 0},
            {"page_size": 0},
            {"page_size": 101},
        ],
    )
    def test_rejects(self, query: dict) -> None:
        with pytest.raises(ValidationError):
            LibraryQuery(**query)
