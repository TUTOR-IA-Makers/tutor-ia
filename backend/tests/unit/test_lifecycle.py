"""The transition table: which question state may follow which. See docs/adr/0015."""

import itertools

import pytest

from codeexpert.domain import QuestionState
from codeexpert.errors import InvalidTransitionError
from codeexpert.lifecycle import (
    ALLOWED_TRANSITIONS,
    INITIAL_STATE,
    can_transition,
    check_transition,
)

S = QuestionState
RUN_ID = "20261113T120000Z-deadbeef"

# Written out by hand on purpose: this is the specification, and the table in
# lifecycle.py is the implementation. A change to one without the other fails.
EXPECTED = {
    (S.GERANDO, S.GERADA),
    (S.GERANDO, S.FALHOU_VERIFICACAO),
    (S.FALHOU_VERIFICACAO, S.GERANDO),
    (S.FALHOU_VERIFICACAO, S.REJEITADA),
    (S.GERADA, S.APROVADA),
    (S.GERADA, S.REJEITADA),
}


def test_every_state_has_a_row() -> None:
    assert set(ALLOWED_TRANSITIONS) == set(QuestionState)


def test_a_question_starts_in_generation() -> None:
    assert INITIAL_STATE is S.GERANDO


@pytest.mark.parametrize(("current", "target"), list(itertools.product(S, S)))
def test_transition_table_matches_the_specification(
    current: QuestionState, target: QuestionState
) -> None:
    assert can_transition(current, target) is ((current, target) in EXPECTED)


@pytest.mark.parametrize(("current", "target"), sorted(EXPECTED))
def test_a_valid_transition_passes(current: QuestionState, target: QuestionState) -> None:
    check_transition(RUN_ID, current, target)


@pytest.mark.parametrize(
    ("current", "target"),
    sorted(set(itertools.product(S, S)) - EXPECTED),
)
def test_an_invalid_transition_raises_and_names_both_states(
    current: QuestionState, target: QuestionState
) -> None:
    with pytest.raises(InvalidTransitionError) as raised:
        check_transition(RUN_ID, current, target)
    message = str(raised.value)
    assert RUN_ID in message
    assert f"is {current} and cannot become {target}" in message


def test_approving_a_failed_question_says_how_to_fix_it() -> None:
    with pytest.raises(InvalidTransitionError, match="failed verification cannot be approved"):
        check_transition(RUN_ID, S.FALHOU_VERIFICACAO, S.APROVADA)


def test_reviewed_questions_are_final() -> None:
    assert not ALLOWED_TRANSITIONS[S.APROVADA]
    assert not ALLOWED_TRANSITIONS[S.REJEITADA]


def test_approval_is_reachable_only_from_gerada() -> None:
    assert {state for state in S if can_transition(state, S.APROVADA)} == {S.GERADA}
