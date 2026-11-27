"""Whose question it is, and how many a teacher started in the last day.

The owner is the teacher id written into `draft.json` when the question is
created. Questions from before sessions existed have none and stay visible to
every teacher, so nothing already generated disappears (docs/adr/0019).
"""

import json
import math
from collections.abc import Iterable
from datetime import UTC, datetime, timedelta

from codeexpert.store import RunListing
from codeexpert.workspace import DRAFT

OWNER_KEY = "owner"
GENERATION_WINDOW = timedelta(hours=24)
_RUN_ID_STAMP = "%Y%m%dT%H%M%SZ"


def owner_of(draft: dict) -> str | None:
    owner = draft.get(OWNER_KEY)
    return owner if isinstance(owner, str) and owner else None


def visible_to(draft: dict, teacher_id: str) -> bool:
    owner = owner_of(draft)
    return owner is None or owner == teacher_id


def listing_visible_to(listing: RunListing, teacher_id: str) -> bool:
    raw = listing.artifacts.get(DRAFT)
    if raw is None:
        return False
    try:
        return visible_to(json.loads(raw), teacher_id)
    except (ValueError, AttributeError):
        return False


def started_at(run_id: str) -> datetime | None:
    """The run id starts with its creation time (`workspace.new_run_id`)."""
    try:
        return datetime.strptime(run_id.split("-", 1)[0], _RUN_ID_STAMP).replace(tzinfo=UTC)
    except ValueError:
        return None


def generation_retry_after(
    listings: Iterable[RunListing], teacher_id: str, limit: int, now: datetime
) -> int | None:
    """Seconds until the teacher may generate again, or `None` when they may now.

    A rolling 24 hours rather than a calendar day: a day that resets at midnight
    UTC resets at 21h in Brasília, which no teacher would expect.
    """
    since = now - GENERATION_WINDOW
    recent = sorted(
        stamp
        for listing in listings
        if DRAFT in listing.artifacts
        and _owned_by(listing.artifacts[DRAFT], teacher_id)
        and (stamp := started_at(listing.run_id)) is not None
        and stamp > since
    )
    if len(recent) < limit:
        return None
    # The oldest generation that still counts leaves the window first.
    oldest = recent[len(recent) - limit]
    return max(1, math.ceil((oldest + GENERATION_WINDOW - now).total_seconds()))


def _owned_by(raw: str, teacher_id: str) -> bool:
    try:
        return owner_of(json.loads(raw)) == teacher_id
    except (ValueError, AttributeError):
        return False
