"""Which question state may follow which — the one table that says so.

Before this, "can this reach a student?" was answered by convention: a run was
either a draft or complete, and nothing recorded whether a person had looked at
it. Every caller that changes a state goes through `check_transition`, so a rule
changes here and nowhere else. See docs/adr/0015.
"""

from codeexpert.domain import QuestionState
from codeexpert.errors import InvalidTransitionError

INITIAL_STATE = QuestionState.GERANDO

ALLOWED_TRANSITIONS: dict[QuestionState, frozenset[QuestionState]] = {
    # The pipeline decides these two: step 5 finished, or step 4 could not
    # compile or run the solution.
    QuestionState.GERANDO: frozenset({QuestionState.GERADA, QuestionState.FALHOU_VERIFICACAO}),
    # Running verification again puts the question back in generation; a teacher
    # may also discard it. Approving is deliberately absent.
    QuestionState.FALHOU_VERIFICACAO: frozenset({QuestionState.GERANDO, QuestionState.REJEITADA}),
    QuestionState.GERADA: frozenset({QuestionState.APROVADA, QuestionState.REJEITADA}),
    # Terminal until editing (G3-3) defines what changing a reviewed question means.
    QuestionState.APROVADA: frozenset(),
    QuestionState.REJEITADA: frozenset(),
}


def _reason(current: QuestionState, target: QuestionState) -> str:
    if current is QuestionState.FALHOU_VERIFICACAO and target is QuestionState.APROVADA:
        return (
            "A question that failed verification cannot be approved. Fix or regenerate the "
            "solution and run the test cases again (POST /gen_testcases)."
        )
    if current is QuestionState.GERANDO:
        return "Generation has not finished. Wait for it, or resume the run step by step."
    allowed = ALLOWED_TRANSITIONS[current]
    if not allowed:
        return f"{current} is final."
    return "From here it can only become " + ", ".join(sorted(allowed)) + "."


def can_transition(current: QuestionState, target: QuestionState) -> bool:
    return target in ALLOWED_TRANSITIONS[current]


def check_transition(run_id: str, current: QuestionState, target: QuestionState) -> None:
    """Raise `InvalidTransitionError` unless `current` may become `target`."""
    if not can_transition(current, target):
        raise InvalidTransitionError(
            f"Question '{run_id}' is {current} and cannot become {target}. "
            f"{_reason(current, target)}"
        )
