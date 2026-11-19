"""The question library: which questions a listing shows, and in what order.

Pure functions over what `ArtifactStore.list_runs` returns, so the rules hold
for every backend and are tested without a server or a database. The store
fetches every run in one call; filtering happens here. That is fine for a bank
of hundreds of questions. When it is not, the filters move into SQL behind the
same `LibraryQuery`, and these tests say what the SQL must keep doing.

The vocabulary is the front-end's (`frontend/src/domain/library.ts`): content
ids, difficulty band ids and the lifecycle states.
"""

import json
import logging
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, Field, ValidationError, field_validator

from codeexpert.api.drafts import CONTENT_AXIS, DIFFICULTY_BANDS, RATING_MIN, QuestionDraft
from codeexpert.api.schemas import QuestionPage, QuestionSummary
from codeexpert.domain import ContentAxis, Difficulty, QuestionState, RunMetadata, Statement
from codeexpert.store import RunListing
from codeexpert.workspace import DRAFT, META, STATEMENT, TESTCASES

logger = logging.getLogger(__name__)

# What a listing reads of each run. Not the solution: a card never shows it.
LISTED_ARTIFACTS = (DRAFT, META, STATEMENT, TESTCASES)
# Shown as the title while step 1 has not run. GET /api/v1/questions/{id} uses it too.
PENDING_TITLE = "Enunciado ainda não gerado"
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
# A run without a readable meta.json sorts last rather than breaking the list.
_UNKNOWN_DATE = datetime.min.replace(tzinfo=UTC)


class DifficultyBand(StrEnum):
    """The band ids of `frontend/src/domain/difficulty.ts`, one per `Difficulty`."""

    MUITO_FACIL = "muito-facil"
    FACIL = "facil"
    MEDIO = "medio"
    DIFICIL = "dificil"
    MUITO_DIFICIL = "muito-dificil"

    @property
    def level(self) -> Difficulty:
        return Difficulty(self.value.replace("-", " "))


class LibraryQuery(BaseModel):
    """The query string of `GET /api/v1/questions`. Every filter is optional."""

    q: str | None = Field(
        default=None,
        max_length=200,
        description="Words that must all appear in the title, statement or context. "
        "Ignores case and accents.",
    )
    content: str | None = Field(default=None, description="A content id, e.g. `condicionais`.")
    axis: ContentAxis | None = Field(default=None, description="The content's taxonomy axis.")
    difficulty: DifficultyBand | None = Field(
        default=None, description="A band; matches questions whose rating range overlaps it."
    )
    status: QuestionState | None = Field(default=None, description="Lifecycle state.")
    page: int = Field(default=1, ge=1, description="Counted from 1.")
    page_size: int = Field(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE)

    @field_validator("q")
    @classmethod
    def _blank_is_no_search(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @field_validator("content")
    @classmethod
    def _known_content(cls, value: str | None) -> str | None:
        if value is not None and value not in CONTENT_AXIS:
            raise ValueError(f"Unknown content '{value}'. Use one of: {', '.join(CONTENT_AXIS)}.")
        return value


@dataclass(frozen=True)
class _Entry:
    summary: QuestionSummary
    created_at: datetime
    text: str


def _fold(text: str) -> str:
    """Lowercase without accents, so "funcao" finds "Função"."""
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(char for char in decomposed if not unicodedata.combining(char)).casefold()


def _band_bounds(level: Difficulty) -> tuple[int, int]:
    """The band's ratings as (exclusive lower, inclusive upper), from the form's bands."""
    lower = RATING_MIN - 1
    for upper, band in DIFFICULTY_BANDS:
        if band is level:
            return lower, upper
        lower = upper
    raise AssertionError(f"No band for {level}")  # DIFFICULTY_BANDS covers every Difficulty.


def _created_at(listing: RunListing) -> datetime:
    meta = listing.artifacts.get(META)
    if meta is None:
        return _UNKNOWN_DATE
    stamp = datetime.fromisoformat(RunMetadata.model_validate_json(meta).created_at)
    return stamp if stamp.tzinfo else stamp.replace(tzinfo=UTC)


def _entry(listing: RunListing) -> _Entry | None:
    # Runs started through the RPC routes have no draft and are not questions to
    # /api/v1, the same rule GET /api/v1/questions/{id} applies.
    if DRAFT not in listing.artifacts:
        return None
    try:
        draft = QuestionDraft.model_validate_json(listing.artifacts[DRAFT])
        statement = (
            Statement.model_validate_json(listing.artifacts[STATEMENT])
            if STATEMENT in listing.artifacts
            else None
        )
        cases = (
            len(json.loads(listing.artifacts[TESTCASES])["testcases"])
            if TESTCASES in listing.artifacts
            else 0
        )
        created_at = _created_at(listing)
    except (ValidationError, ValueError, KeyError, TypeError):
        # One damaged run must not take the whole library down with it.
        logger.warning("Run %s — unreadable artefacts, left out of the library", listing.run_id)
        return None

    title = statement.name if statement else PENDING_TITLE
    summary = QuestionSummary(
        id=listing.run_id,
        code=listing.run_id,
        title=title,
        description=draft.context or "",
        content_id=draft.content_id,
        difficulty_min=draft.difficulty_min,
        difficulty_max=draft.difficulty_max,
        status=listing.state,
        test_case_count=cases or draft.test_case_count,
    )
    text = _fold(f"{title} {statement.statement if statement else ''} {draft.context or ''}")
    return _Entry(summary, created_at, text)


def _matches(entry: _Entry, query: LibraryQuery) -> bool:
    summary = entry.summary
    if query.q and not all(term in entry.text for term in _fold(query.q).split()):
        return False
    if query.content and summary.content_id != query.content:
        return False
    if query.axis and CONTENT_AXIS[summary.content_id] is not query.axis:
        return False
    if query.difficulty:
        lower, upper = _band_bounds(query.difficulty.level)
        # Overlap, not containment: a 1200-1600 question is both fácil and médio,
        # as the library's mock data has always treated it.
        if summary.difficulty_min > upper or summary.difficulty_max <= lower:
            return False
    return not (query.status and summary.status is not query.status)


def list_questions(listings: list[RunListing], query: LibraryQuery) -> QuestionPage:
    """Filter, sort newest first, and cut out the requested page.

    A page past the end is an empty page, not an error: the client may hold a
    page number from before a filter narrowed the list.
    """
    entries = [entry for listing in listings if (entry := _entry(listing)) is not None]
    matching = sorted(
        (entry for entry in entries if _matches(entry, query)),
        # The run id breaks ties within the same instant, so pages never overlap.
        key=lambda entry: (entry.created_at, entry.summary.id),
        reverse=True,
    )
    start = (query.page - 1) * query.page_size
    return QuestionPage(
        items=[entry.summary for entry in matching[start : start + query.page_size]],
        total=len(matching),
        page=query.page,
        page_size=query.page_size,
    )
