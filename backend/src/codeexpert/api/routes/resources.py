"""The resource API the web client calls: create, follow and read a question.

The browser asks for a question and polls; the server chains the five steps in
a background job whose state lives in the store, so a restart leaves it
`INTERROMPIDO` and resumable instead of lost. See docs/adr/0013, docs/adr/0017
and docs/architecture/frontend-integracao.md.

A question is a run that was started here, so its id is the run id. Runs
started through the RPC routes have no `draft.json` and are not questions to
this API.

The routes are `def`, not `async def`: every store call blocks, and FastAPI runs
plain functions in its thread pool instead of on the event loop.
"""

import logging

from fastapi import APIRouter, BackgroundTasks, status

from codeexpert.api.deps import LLMDep, RunnerDep, StoreDep, create_run, open_run
from codeexpert.api.drafts import QuestionDraft, to_constraints
from codeexpert.api.schemas import (
    ApproveRequest,
    CreatedResponse,
    GenerationResponse,
    JobView,
    QuestionResource,
    StatementView,
    TestCaseView,
)
from codeexpert.domain import JobRecord, JobState, Statement, TestCase
from codeexpert.errors import RunNotFoundError
from codeexpert.generation.job import (
    GenerationProgress,
    claim_resume,
    read_progress,
    run_generation,
    start_job,
)
from codeexpert.store import ArtifactStore
from codeexpert.workspace import DRAFT, SOLUTION, STATEMENT, TESTCASES, RunWorkspace

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["questions"])


def _open_question(question_id: str, store: ArtifactStore) -> tuple[RunWorkspace, QuestionDraft]:
    workspace = open_run(question_id, store)
    if not workspace.exists(DRAFT):
        raise RunNotFoundError(
            f"Question '{question_id}' not found. Create one with POST /api/v1/questions."
        )
    return workspace, QuestionDraft.model_validate(workspace.read_json(DRAFT))


def _job(job: JobRecord) -> JobView:
    return JobView(
        state=job.state,
        step=job.step,
        resumable=job.state is JobState.INTERROMPIDO,
        updated_at=job.updated_at,
    )


def _generation(question_id: str, progress: GenerationProgress) -> GenerationResponse:
    return GenerationResponse(
        question_id=question_id,
        run_id=question_id,
        status=progress.state,
        completed_steps=progress.completed_steps,
        failure_reason=progress.failure_reason,
        job=_job(progress.job),
    )


@router.post(
    "/questions",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=CreatedResponse,
)
def create_question_resource(
    draft: QuestionDraft,
    background: BackgroundTasks,
    store: StoreDep,
    llm: LLMDep,
    runner: RunnerDep,
) -> CreatedResponse:
    """Start a generation and answer at once; poll `/generation` to follow it."""
    constraints = to_constraints(draft)
    workspace = create_run(store)
    # The job record first, then the draft: a question is visible from the draft
    # on, and it must never be visible without a job saying where it stands.
    start_job(workspace)
    # Written before the job starts, so a poll that arrives first already finds
    # a question in GERANDO instead of a 404.
    workspace.write_json(DRAFT, draft.model_dump(mode="json"))
    background.add_task(run_generation, workspace, constraints, draft.test_case_count, llm, runner)
    logger.info("Run %s — generation queued", workspace.run_id)
    return CreatedResponse(id=workspace.run_id)


@router.get("/questions/{question_id}/generation", response_model=GenerationResponse)
def get_generation(question_id: str, store: StoreDep) -> GenerationResponse:
    workspace, _ = _open_question(question_id, store)
    return _generation(question_id, read_progress(workspace))


@router.post(
    "/questions/{question_id}/resume",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=GenerationResponse,
)
def resume_generation(
    question_id: str,
    background: BackgroundTasks,
    store: StoreDep,
    llm: LLMDep,
    runner: RunnerDep,
) -> GenerationResponse:
    """Continue an `INTERROMPIDO` generation from the first step not yet recorded.

    Steps already finished are not run again, so no model call is paid twice.
    Anything other than `INTERROMPIDO` is a 409. Poll `/generation` to follow it.
    """
    workspace, draft = _open_question(question_id, store)
    claim_resume(workspace)
    background.add_task(
        run_generation, workspace, to_constraints(draft), draft.test_case_count, llm, runner
    )
    return _generation(question_id, read_progress(workspace))


def _resource(question_id: str, workspace: RunWorkspace, draft: QuestionDraft) -> QuestionResource:
    progress = read_progress(workspace)
    metadata = workspace.read_metadata()

    statement = (
        Statement.model_validate(workspace.read_json(STATEMENT))
        if workspace.exists(STATEMENT)
        else None
    )
    cases = (
        [TestCase.model_validate(item) for item in workspace.read_json(TESTCASES)["testcases"]]
        if workspace.exists(TESTCASES)
        else []
    )
    return QuestionResource(
        id=question_id,
        code=question_id,
        title=statement.name if statement else "Enunciado ainda não gerado",
        description=draft.context or "",
        content_id=draft.content_id,
        difficulty_min=draft.difficulty_min,
        difficulty_max=draft.difficulty_max,
        status=progress.state,
        test_case_count=len(cases) if cases else draft.test_case_count,
        statement=StatementView(text=statement.statement if statement else ""),
        solution=workspace.read_text(SOLUTION) if workspace.exists(SOLUTION) else None,
        test_cases=[
            TestCaseView(id=f"caso-{index}", input=case.input, expected_output=case.output)
            for index, case in enumerate(cases, start=1)
        ],
        structures=draft.structures,
        failure_reason=progress.failure_reason,
        reviewed=metadata.reviewed,
        approved_by=metadata.approved_by,
        approved_at=metadata.approved_at,
        job=_job(progress.job),
    )


@router.get("/questions/{question_id}", response_model=QuestionResource)
def get_question_resource(question_id: str, store: StoreDep) -> QuestionResource:
    """The question in whatever state it is in.

    The client loads the question before choosing between the progress and the
    review screen, so a question still in GERANDO answers with what exists so far
    rather than a 404.
    """
    workspace, draft = _open_question(question_id, store)
    return _resource(question_id, workspace, draft)


@router.post("/questions/{question_id}/approve", response_model=QuestionResource)
def approve_question_resource(
    question_id: str, request: ApproveRequest, store: StoreDep
) -> QuestionResource:
    """The review screen's Aprovar button. Same rules as `POST /questions/{id}/approve`.

    Answers with the whole question, as the client replaces its copy with it.
    """
    workspace, draft = _open_question(question_id, store)
    workspace.approve(request.approved_by)
    return _resource(question_id, workspace, draft)
