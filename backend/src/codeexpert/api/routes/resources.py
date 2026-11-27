"""The resource API the web client calls: create, follow, read and list questions.

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
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response, status

from codeexpert.api.deps import (
    CurrentTeacher,
    LLMDep,
    RunnerDep,
    SettingsDep,
    StoreDep,
    create_run,
    open_run,
    require_web_client,
)
from codeexpert.api.drafts import QuestionDraft, to_constraints
from codeexpert.api.library import LISTED_ARTIFACTS, PENDING_TITLE, LibraryQuery, list_questions
from codeexpert.api.ownership import (
    OWNER_KEY,
    generation_retry_after,
    listing_visible_to,
    visible_to,
)
from codeexpert.api.schemas import (
    CreatedResponse,
    GenerationResponse,
    JobView,
    MoodleExportRequest,
    QuestionPage,
    QuestionResource,
    StatementUpdate,
    StatementView,
    TestCaseView,
)
from codeexpert.api.statement_view import StatementParts, join_statement, split_statement
from codeexpert.domain import JobRecord, JobState, QuestionState, Statement, TestCase
from codeexpert.errors import InvalidTransitionError, RunNotFoundError, TooManyRequestsError
from codeexpert.export.moodle import build_questionnaire
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
# Every route needs a session, and every write the web client's header.
router = APIRouter(
    prefix="/api/v1",
    tags=["questions"],
    dependencies=[Depends(require_web_client)],
)


def _open_question(
    question_id: str, store: ArtifactStore, teacher_id: str
) -> tuple[RunWorkspace, QuestionDraft]:
    """The question, if it exists and this teacher may see it.

    Another teacher's question is a 404, the same as one that does not exist:
    a 403 would confirm that the id is real.
    """
    workspace = open_run(question_id, store)
    not_found = RunNotFoundError(
        f"Question '{question_id}' not found. Create one with POST /api/v1/questions."
    )
    if not workspace.exists(DRAFT):
        raise not_found
    raw = workspace.read_json(DRAFT)
    if not visible_to(raw, teacher_id):
        raise not_found
    return workspace, QuestionDraft.model_validate(raw)


def _conflict(message: str, question_id: str) -> InvalidTransitionError:
    error = InvalidTransitionError(message)
    error.run_id = question_id
    return error


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
    teacher: CurrentTeacher,
    settings: SettingsDep,
) -> CreatedResponse:
    """Start a generation and answer at once; poll `/generation` to follow it.

    Each generation is paid to the model provider, so a teacher may start
    `daily_generation_limit` of them in any 24 hours; the next is a 429 saying
    when to try again.
    """
    retry_after = generation_retry_after(
        store.list_runs((DRAFT,)),
        teacher.id,
        settings.daily_generation_limit,
        datetime.now(UTC),
    )
    if retry_after is not None:
        raise TooManyRequestsError(
            f"Daily limit of {settings.daily_generation_limit} generations reached.",
            retry_after,
        )
    constraints = to_constraints(draft)
    workspace = create_run(store)
    # The job record first, then the draft: a question is visible from the draft
    # on, and it must never be visible without a job saying where it stands.
    start_job(workspace)
    # Written before the job starts, so a poll that arrives first already finds
    # a question in GERANDO instead of a 404.
    # The owner is set here and never read from the body: QuestionDraft has no
    # such field, so a client cannot create a question in someone else's name.
    workspace.write_json(DRAFT, {**draft.model_dump(mode="json"), OWNER_KEY: teacher.id})
    background.add_task(run_generation, workspace, constraints, draft.test_case_count, llm, runner)
    logger.info("Run %s — generation queued", workspace.run_id)
    return CreatedResponse(id=workspace.run_id)


@router.get("/questions", response_model=QuestionPage)
def list_question_resources(
    query: Annotated[LibraryQuery, Query()], store: StoreDep, teacher: CurrentTeacher
) -> QuestionPage:
    """The library: questions in any state, newest first, filtered and paginated.

    No match, no questions at all and a page past the end are all `200` with an
    empty `items`; `total` says which of the three it is.
    """
    listings = [
        listing
        for listing in store.list_runs(LISTED_ARTIFACTS)
        if listing_visible_to(listing, teacher.id)
    ]
    return list_questions(listings, query)


@router.get("/questions/{question_id}/generation", response_model=GenerationResponse)
def get_generation(
    question_id: str, store: StoreDep, teacher: CurrentTeacher
) -> GenerationResponse:
    workspace, _ = _open_question(question_id, store, teacher.id)
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
    teacher: CurrentTeacher,
) -> GenerationResponse:
    """Continue an `INTERROMPIDO` generation from the first step not yet recorded.

    Steps already finished are not run again, so no model call is paid twice.
    Anything other than `INTERROMPIDO` is a 409. Poll `/generation` to follow it.
    """
    workspace, draft = _open_question(question_id, store, teacher.id)
    claim_resume(workspace)
    background.add_task(
        run_generation, workspace, to_constraints(draft), draft.test_case_count, llm, runner
    )
    return _generation(question_id, read_progress(workspace))


def _statement_view(statement: Statement | None) -> StatementView:
    if statement is None:
        return StatementView(text="")
    parts = split_statement(statement.name, statement.statement)
    return StatementView(text=parts.text, input=parts.input, output=parts.output)


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
        title=statement.name if statement else PENDING_TITLE,
        description=draft.context or "",
        content_id=draft.content_id,
        difficulty_min=draft.difficulty_min,
        difficulty_max=draft.difficulty_max,
        status=progress.state,
        test_case_count=len(cases) if cases else draft.test_case_count,
        statement=_statement_view(statement),
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
def get_question_resource(
    question_id: str, store: StoreDep, teacher: CurrentTeacher
) -> QuestionResource:
    """The question in whatever state it is in.

    The client loads the question before choosing between the progress and the
    review screen, so a question still in GERANDO answers with what exists so far
    rather than a 404.
    """
    workspace, draft = _open_question(question_id, store, teacher.id)
    return _resource(question_id, workspace, draft)


@router.post("/questions/{question_id}/approve", response_model=QuestionResource)
def approve_question_resource(
    question_id: str, store: StoreDep, teacher: CurrentTeacher
) -> QuestionResource:
    """The review screen's Aprovar button. Same rules as `POST /questions/{id}/approve`.

    The approver is the signed-in teacher, never a name from the body, so no
    one can approve in someone else's name. Answers with the whole question, as
    the client replaces its copy with it.
    """
    workspace, draft = _open_question(question_id, store, teacher.id)
    workspace.approve(teacher.name)
    return _resource(question_id, workspace, draft)


@router.post("/questions/{question_id}/reject", response_model=QuestionResource)
def reject_question_resource(
    question_id: str, store: StoreDep, teacher: CurrentTeacher
) -> QuestionResource:
    """GERADA or FALHOU_VERIFICACAO → REJEITADA. Anything else is a 409."""
    workspace, draft = _open_question(question_id, store, teacher.id)
    workspace.transition(QuestionState.REJEITADA)
    return _resource(question_id, workspace, draft)


@router.post(
    "/questions/{question_id}/regenerate",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=CreatedResponse,
)
def regenerate_question(
    question_id: str,
    background: BackgroundTasks,
    store: StoreDep,
    llm: LLMDep,
    runner: RunnerDep,
    teacher: CurrentTeacher,
    settings: SettingsDep,
) -> CreatedResponse:
    """Generate the same request again, as a new question with a new id.

    A new run and not the old one restarted: APROVADA and REJEITADA are final,
    and a failed run is the record of why it failed. The old question stays as
    it is. A question still generating is a 409.
    """
    workspace, draft = _open_question(question_id, store, teacher.id)
    if read_progress(workspace).state is QuestionState.GERANDO:
        raise _conflict(f"Question '{question_id}' is still being generated.", question_id)
    return create_question_resource(draft, background, store, llm, runner, teacher, settings)


@router.patch("/questions/{question_id}/statement", response_model=QuestionResource)
def update_statement(
    question_id: str, update: StatementUpdate, store: StoreDep, teacher: CurrentTeacher
) -> QuestionResource:
    """The teacher's edit of a GERADA statement. The title is kept.

    The parts are joined back into the single text the export reads. An approved
    question is final, so only GERADA is editable; anything else is a 409.
    """
    workspace, draft = _open_question(question_id, store, teacher.id)
    current = read_progress(workspace).state
    if current is not QuestionState.GERADA:
        raise _conflict(
            f"Question '{question_id}' is {current.value}; only GERADA can be edited.",
            question_id,
        )
    statement = Statement.model_validate(workspace.read_json(STATEMENT))
    parts = StatementParts(text=update.text, input=update.input, output=update.output)
    edited = Statement(name=statement.name, statement=join_statement(statement.name, parts))
    workspace.write_json(STATEMENT, edited.model_dump(mode="json"))
    return _resource(question_id, workspace, draft)


EXPORT_FILENAME = "questoes_codeexpert.xml"


@router.post("/exports/moodle", response_class=Response)
def export_moodle(
    request: MoodleExportRequest, store: StoreDep, teacher: CurrentTeacher
) -> Response:
    """One Moodle CodeRunner XML file with the chosen questions, for download.

    Only APROVADA questions are exported: a 409 names the first that is not,
    and nothing is sent.
    """
    workspaces = []
    for question_id in dict.fromkeys(request.question_ids):
        workspace, _ = _open_question(question_id, store, teacher.id)
        state = read_progress(workspace).state
        if state is not QuestionState.APROVADA:
            raise _conflict(
                f"Question '{question_id}' is {state.value}; only APROVADA can be exported.",
                question_id,
            )
        workspaces.append(workspace)
    return Response(
        content=build_questionnaire(workspaces),
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="{EXPORT_FILENAME}"'},
    )
