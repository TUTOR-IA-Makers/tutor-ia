"""Question classification reuses the catalog vocabulary without guessing an axis."""

import pytest
from pydantic import ValidationError

from codeexpert.domain import Constraints, ContentAxis


def test_legacy_constraints_have_no_inferred_axis() -> None:
    assert Constraints.model_validate({"difficulty": "facil"}).axis is None


@pytest.mark.parametrize("axis", list(ContentAxis))
def test_axis_round_trips_in_constraints(axis: ContentAxis) -> None:
    constraints = Constraints(axis=axis)
    assert Constraints.model_validate_json(constraints.model_dump_json()) == constraints


def test_unknown_axis_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Constraints(axis="unknown")
