"""Question classification reuses the catalog vocabulary without guessing an axis."""

import re
from enum import StrEnum
from importlib import resources

import pytest
from pydantic import ValidationError

from codeexpert.domain import Constraints, ContentAxis, Difficulty


def test_legacy_constraints_have_no_inferred_axis() -> None:
    assert Constraints.model_validate({"difficulty": "facil"}).axis is None


@pytest.mark.parametrize("axis", list(ContentAxis))
def test_axis_round_trips_in_constraints(axis: ContentAxis) -> None:
    constraints = Constraints(axis=axis)
    assert Constraints.model_validate_json(constraints.model_dump_json()) == constraints


def test_unknown_axis_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Constraints(axis="unknown")


def _check_values(column: str) -> set[str]:
    """The literals a column's CHECK (... IN (...)) clause accepts in schema.sql."""
    schema = (resources.files("codeexpert.store") / "schema.sql").read_text(encoding="utf-8")
    match = re.search(rf"\b{column} text CHECK \({column} IN \((.*?)\)\)", schema, re.DOTALL)
    assert match, f"no CHECK clause for {column}"
    return set(re.findall(r"'([^']*)'", match.group(1)))


# The database repeats the enums as literals; a new member must not be rejected
# by Postgres at completion time without a test failing first.
@pytest.mark.parametrize(("column", "enum"), [("difficulty", Difficulty), ("axis", ContentAxis)])
def test_schema_check_matches_enum(column: str, enum: type[StrEnum]) -> None:
    assert _check_values(column) == {member.value for member in enum}
