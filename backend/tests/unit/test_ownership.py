"""Who sees a question, and the rolling daily generation limit."""

import json
from datetime import UTC, datetime, timedelta

from codeexpert.api.ownership import generation_retry_after, started_at, visible_to
from codeexpert.domain import QuestionState
from codeexpert.store import RunListing
from codeexpert.workspace import DRAFT

NOW = datetime(2026, 11, 27, 12, 0, tzinfo=UTC)


def _listing(owner: str | None, age: timedelta, suffix: str = "a1b2c3d4") -> RunListing:
    stamp = (NOW - age).strftime("%Y%m%dT%H%M%SZ")
    draft = {"content_id": "condicionais"} | ({"owner": owner} if owner else {})
    return RunListing(f"{stamp}-{suffix}", QuestionState.GERADA, {DRAFT: json.dumps(draft)})


def test_a_question_without_owner_is_visible_to_everyone() -> None:
    assert visible_to({}, "ana")
    assert visible_to({"owner": "ana"}, "ana")
    assert not visible_to({"owner": "bia"}, "ana")


def test_the_run_id_carries_its_start() -> None:
    assert started_at("20261127T120000Z-a1b2c3d4") == NOW
    assert started_at("nao-e-um-id") is None


def test_under_the_limit_there_is_no_wait() -> None:
    listings = [_listing("ana", timedelta(hours=1))]
    assert generation_retry_after(listings, "ana", limit=2, now=NOW) is None


def test_at_the_limit_the_wait_ends_when_the_oldest_leaves_the_window() -> None:
    listings = [
        _listing("ana", timedelta(hours=20), "00000001"),
        _listing("ana", timedelta(hours=1), "00000002"),
        _listing("ana", timedelta(hours=30), "00000003"),  # outside the window
        _listing("bia", timedelta(hours=2), "00000004"),  # someone else's
        _listing(None, timedelta(hours=2), "00000005"),  # nobody's
    ]
    assert generation_retry_after(listings, "ana", limit=2, now=NOW) == 4 * 3600
