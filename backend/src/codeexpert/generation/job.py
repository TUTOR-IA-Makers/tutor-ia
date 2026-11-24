"""The pipeline as a job that runs outside the request, survives a restart, and resumes.

`POST /api/v1/questions` answers before generation starts, so a failure cannot
travel back as an HTTP error, and nobody is waiting on a request that would
notice the server restarting. The job's state, current step and error are kept
in the store as a `JobRecord` and read by whoever polls. On startup a job still
`EM_ANDAMENTO` cannot be running any more, and becomes `INTERROMPIDO`. Resuming
runs only the steps `meta.json` does not record, so a model call already paid
for is never made twice.

Lives here, not in `api/`, so a future worker process can run the same
functions. See docs/adr/0017.
"""

import logging
from datetime import UTC, datetime

from pydantic import BaseModel

from codeexpert.domain import Constraints, JobRecord, JobState, QuestionState
from codeexpert.errors import (
    CodeExpertError,
    CompilationError,
    ConfigurationError,
    ExecutionError,
    JobNotResumableError,
    LLMError,
)
from codeexpert.execution import CodeRunner
from codeexpert.export.moodle import export_run
from codeexpert.generation.codegen import generate_code
from codeexpert.generation.inputs import generate_inputs
from codeexpert.generation.statement import generate_statement
from codeexpert.generation.testcases import generate_testcases
from codeexpert.llm import LLMClient
from codeexpert.store import ArtifactStore
from codeexpert.workspace import FAILURE, RunWorkspace

logger = logging.getLogger(__name__)

# The five steps in pipeline order; `JobRecord.step` is one of these. The first
# four are recorded in meta.json by `record_step`. Export is not: it is what
# marks the run complete.
STEPS = ("statement", "code", "inputs", "testcases", "export")
RECORDED_STEPS = STEPS[:-1]
TOTAL_STEPS = len(STEPS)

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
INTERRUPTED_REASON = (
    "A geração foi interrompida porque o servidor reiniciou. Retome para continuar "
    "de onde parou, sem repetir as etapas já concluídas."
)


class GenerationProgress(BaseModel):
    state: QuestionState
    completed_steps: int
    failure_reason: str | None = None
    job: JobRecord


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _reason(exc: Exception) -> str:
    return next(
        (text for error_type, text in _REASONS if isinstance(exc, error_type)),
        _GENERIC_REASON,
    )


def _recorded(workspace: RunWorkspace) -> set[str]:
    # A set, because a step retried through the RPC routes is recorded twice.
    return {step.step for step in workspace.read_metadata().steps}


def _pending_steps(workspace: RunWorkspace) -> tuple[str, ...]:
    """The steps still to run: everything from the first one meta.json does not record.

    Each step reads what the previous ones wrote, so a gap means everything after
    it runs again. A step that wrote its artefact and then died before recording
    itself runs again too; that window is the price of not having a transaction
    across artefact and metadata, and it costs at most one call.
    """
    if workspace.is_complete():
        return ()
    recorded = _recorded(workspace)
    first = next(
        (index for index, step in enumerate(RECORDED_STEPS) if step not in recorded),
        len(RECORDED_STEPS),
    )
    return STEPS[first:]


def _run_step(
    step: str,
    workspace: RunWorkspace,
    constraints: Constraints,
    quantity: int,
    llm: LLMClient,
    runner: CodeRunner,
) -> None:
    match step:
        case "statement":
            generate_statement(workspace, constraints, llm)
        case "code":
            generate_code(workspace, llm)
        case "inputs":
            generate_inputs(workspace, quantity, llm)
        case "testcases":
            generate_testcases(workspace, runner)
        case "export":
            export_run(workspace)
        case _:
            raise ValueError(f"Unknown generation step '{step}'.")


def read_job(workspace: RunWorkspace) -> JobRecord:
    """The run's job record, made consistent with what the run itself says.

    A complete run's job is `CONCLUIDO` whatever was written last: the process may
    have died between finishing step 5 and saying so. A run started before G0-8 has
    no record, and nothing can still be running it.
    """
    job = workspace.read_job()
    if workspace.is_complete():
        if job is not None and job.state is JobState.CONCLUIDO:
            return job
        return JobRecord(state=JobState.CONCLUIDO, updated_at=_now())
    if job is not None:
        return job
    created_at = workspace.read_metadata().created_at
    if workspace.exists(FAILURE):
        failure = workspace.read_json(FAILURE)
        return JobRecord(
            state=JobState.FALHOU,
            failure_reason=failure.get("reason") or _GENERIC_REASON,
            error=failure.get("error"),
            updated_at=created_at,
        )
    return JobRecord(state=JobState.INTERROMPIDO, updated_at=created_at)


def generation_stopped(state: QuestionState, job: JobState) -> bool:
    """Whether a question still waiting on its generation has nothing running any more.

    The question is `GERANDO` (or `FALHOU_VERIFICACAO`, mid-retry) in the store,
    but its job `FALHOU` or was `INTERROMPIDO`. Such a question is shown as
    `FALHOU_VERIFICACAO`. One function, so `/generation`, the question resource and
    the library listing never disagree about the same question.
    """
    return state in (QuestionState.GERANDO, QuestionState.FALHOU_VERIFICACAO) and job in (
        JobState.FALHOU,
        JobState.INTERROMPIDO,
    )


def read_progress(workspace: RunWorkspace) -> GenerationProgress:
    """Where a question stands: its lifecycle state, plus how far the job got.

    The state is the one `codeexpert.lifecycle` keeps (docs/adr/0015), so a
    question approved or rejected through the review routes reads the same here.
    Two job outcomes have no lifecycle state of their own: a step before
    verification failed (the model, say), or the server restarted mid-job. The
    question is still `GERANDO` in the store, but nothing is running any more, so
    `state` reads `FALHOU_VERIFICACAO` with a reason and the screen stops polling.
    `job.state` says which of the two it was (docs/adr/0017).
    """
    state = workspace.state
    job = read_job(workspace)
    if workspace.is_complete():
        completed = TOTAL_STEPS
    else:
        recorded = _recorded(workspace)
        completed = sum(1 for step in RECORDED_STEPS if step in recorded)

    if not generation_stopped(state, job.state):
        return GenerationProgress(state=state, completed_steps=completed, job=job)
    if job.state is JobState.FALHOU:
        reason = job.failure_reason or _GENERIC_REASON
    else:
        reason = INTERRUPTED_REASON
    return GenerationProgress(
        state=QuestionState.FALHOU_VERIFICACAO,
        completed_steps=completed,
        failure_reason=reason,
        job=job,
    )


def start_job(workspace: RunWorkspace) -> None:
    """Record the job before it is queued, so a restart before it starts still finds it."""
    workspace.save_job(JobRecord(state=JobState.EM_ANDAMENTO, updated_at=_now()))


def claim_resume(workspace: RunWorkspace) -> None:
    """Move an interrupted job back to `EM_ANDAMENTO`, or raise `JobNotResumableError`.

    A compare-and-set in the store, so two clicks on Retomar start one job, not two.
    """
    job = read_job(workspace)
    if job.state is JobState.EM_ANDAMENTO:
        raise JobNotResumableError(
            f"Generation of question '{workspace.run_id}' is still running. Wait for it."
        )
    if job.state is JobState.CONCLUIDO:
        raise JobNotResumableError(
            f"Generation of question '{workspace.run_id}' has finished. There is nothing to resume."
        )
    if job.state is JobState.FALHOU:
        raise JobNotResumableError(
            f"Generation of question '{workspace.run_id}' failed and cannot be resumed. "
            "Create the question again (POST /api/v1/questions)."
        )

    stored = workspace.read_job()
    resumed = job.model_copy(update={"state": JobState.EM_ANDAMENTO, "updated_at": _now()})
    if not workspace.replace_job(stored.state if stored else None, resumed):
        raise JobNotResumableError(
            f"Generation of question '{workspace.run_id}' changed while it was being resumed. "
            "Read it again."
        )
    logger.info("Run %s — resuming from step %s", workspace.run_id, job.step or STEPS[0])


def run_generation(
    workspace: RunWorkspace,
    constraints: Constraints,
    quantity: int,
    llm: LLMClient,
    runner: CodeRunner,
) -> None:
    """Run the steps not yet recorded; on any failure, record why instead of raising.

    The same function starts a job and resumes one: a fresh run has nothing
    recorded, so all five steps run. Nothing is listening for an exception here:
    raised inside a background task it would only reach the server log, and the
    job would read `EM_ANDAMENTO` until the next restart. Catching `Exception` is
    the point, not a shortcut. A process that dies skips this block entirely,
    which is what the startup sweep is for.
    """
    step: str | None = None
    try:
        for step in _pending_steps(workspace):
            workspace.save_job(JobRecord(state=JobState.EM_ANDAMENTO, step=step, updated_at=_now()))
            _run_step(step, workspace, constraints, quantity, llm, runner)
    except Exception as exc:
        logger.exception("Run %s — background generation failed at %s", workspace.run_id, step)
        workspace.save_job(
            JobRecord(
                state=JobState.FALHOU,
                step=step,
                failure_reason=_reason(exc),
                error=type(exc).__name__,
                updated_at=_now(),
            )
        )
        return
    workspace.save_job(JobRecord(state=JobState.CONCLUIDO, updated_at=_now()))


def recover_interrupted_jobs(store: ArtifactStore) -> list[str]:
    """Mark every job left `EM_ANDAMENTO` by a previous process as `INTERROMPIDO`.

    Correct only while one process runs the API (deploy/compose.yaml): a second
    one starting would interrupt the first one's live jobs. See docs/adr/0017.
    """
    interrupted = store.interrupt_running_jobs()
    for run_id in interrupted:
        logger.warning(
            "Run %s — generation interrupted by a restart; resume with "
            "POST /api/v1/questions/%s/resume",
            run_id,
            run_id,
        )
    return interrupted
