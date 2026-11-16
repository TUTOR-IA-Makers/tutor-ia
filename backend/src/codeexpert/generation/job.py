"""The pipeline as a job that runs outside the request, and how far it got.

`POST /api/v1/questions` answers before generation starts, so a failure can no
longer travel back as an HTTP error. It is recorded in the run instead
(`failure.json`) and read by whoever polls. Lives here, not in `api/`, so a
future worker process (G0-8) can run the same function.
"""

import logging

from pydantic import BaseModel

from codeexpert.domain import Constraints, QuestionState
from codeexpert.errors import (
    CodeExpertError,
    CompilationError,
    ConfigurationError,
    ExecutionError,
    LLMError,
)
from codeexpert.execution import CodeRunner
from codeexpert.generation.pipeline import create_question
from codeexpert.llm import LLMClient
from codeexpert.workspace import FAILURE, RunWorkspace

logger = logging.getLogger(__name__)

# The steps `record_step` writes to meta.json, in pipeline order. The fifth,
# export, is not recorded there: it is what marks the run complete.
RECORDED_STEPS = ("statement", "code", "inputs", "testcases")
TOTAL_STEPS = len(RECORDED_STEPS) + 1

# Teacher-facing (Portuguese), and deliberately without the exception text: a
# compiler log or a provider body is not something to show on the screen. The
# details stay in the server log under the run id.
_REASONS: list[tuple[type[CodeExpertError], str]] = [
    (CompilationError, "A solução gerada não compilou. Gere a questão de novo."),
    (
        ExecutionError,
        "A solução gerada não executou até o fim com os casos de teste. Gere a questão de novo.",
    ),
    (
        LLMError,
        "O serviço de geração falhou ou respondeu num formato inesperado. "
        "Tente de novo em alguns minutos.",
    ),
    (ConfigurationError, "O servidor não está configurado para gerar questões. Avise a equipe."),
]
_GENERIC_REASON = "A geração parou antes de terminar. Gere a questão de novo."


class GenerationProgress(BaseModel):
    state: QuestionState
    completed_steps: int
    failure_reason: str | None = None


def _reason(exc: Exception) -> str:
    return next(
        (text for error_type, text in _REASONS if isinstance(exc, error_type)),
        _GENERIC_REASON,
    )


def read_progress(workspace: RunWorkspace) -> GenerationProgress:
    """Where a question stands: its lifecycle state, plus how far the job got.

    The state is the one `codeexpert.lifecycle` keeps (docs/adr/0015), so a
    question approved or rejected through the review routes reads the same here.
    One case has no lifecycle state of its own: a step before verification
    failed (the model, say). The question is then still `GERANDO` in the store,
    but nothing is running any more, so it is reported as `FALHOU_VERIFICACAO`
    rather than leaving the screen polling forever. G0-8 gives that case a real
    state.
    """
    state = workspace.state
    if workspace.is_complete():
        completed = TOTAL_STEPS
    else:
        # A set, because a step retried through the RPC routes is recorded twice.
        recorded = {step.step for step in workspace.read_metadata().steps}
        completed = sum(1 for step in RECORDED_STEPS if step in recorded)

    failed = workspace.exists(FAILURE) and state in (
        QuestionState.GERANDO,
        QuestionState.FALHOU_VERIFICACAO,
    )
    if not failed:
        return GenerationProgress(state=state, completed_steps=completed)
    reason = workspace.read_json(FAILURE).get("reason") or _GENERIC_REASON
    return GenerationProgress(
        state=QuestionState.FALHOU_VERIFICACAO, completed_steps=completed, failure_reason=reason
    )


def run_generation(
    workspace: RunWorkspace,
    constraints: Constraints,
    quantity: int,
    llm: LLMClient,
    runner: CodeRunner,
) -> None:
    """Run the five steps; on any failure, record why instead of raising.

    Nothing is listening for an exception here: raised inside a background task
    it would only reach the server log, and the run would look `GERANDO`
    forever. Catching `Exception` is the point, not a shortcut.
    """
    try:
        create_question(workspace, constraints, quantity, llm, runner)
    except Exception as exc:
        logger.exception("Run %s — background generation failed", workspace.run_id)
        workspace.write_json(FAILURE, {"reason": _reason(exc), "error": type(exc).__name__})
