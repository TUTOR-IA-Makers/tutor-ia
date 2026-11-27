"""Wire contracts.

Separate from `codeexpert.domain` on purpose: the entities are free to change
shape without silently changing the API, and every response carries the `run_id`
so a client can drive the pipeline one step at a time.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from codeexpert.api.drafts import StructureRules
from codeexpert.domain import (
    Constraints,
    Difficulty,
    JobState,
    QuestionState,
    RunMetadata,
    Statement,
    TestCase,
)

_STATE_DESCRIPTION = "Lifecycle state. Only APROVADA may reach a student. See docs/adr/0015."


class StatementRequest(Constraints):
    """Constraints, plus an optional run to append to."""

    run_id: str | None = Field(
        default=None,
        description="Reuse an existing run. Omit to start a new one.",
    )


class RunRequest(BaseModel):
    run_id: str


class InputRequest(RunRequest):
    qty: int = Field(default=10, ge=1, le=100)


class CreateQuestionRequest(BaseModel):
    statement_request: StatementRequest = StatementRequest()
    input_request: InputRequest | None = None
    qty: int = Field(default=10, ge=1, le=100)


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    commit: str | None = Field(
        default=None,
        description="Commit this instance was deployed from. Null when not deployed by CI.",
    )


class ConfigResponse(BaseModel):
    model: str
    api_base_url: str
    api_key_configured: bool
    workspace_root: str
    provider_reachable: bool | None = None
    status: str


class StatementResponse(BaseModel):
    run_id: str
    name: str
    statement: str


class CodeResponse(BaseModel):
    run_id: str
    code: str


class InputResponse(BaseModel):
    run_id: str
    inputs: list[str]


class TestCaseResponse(BaseModel):
    run_id: str
    testcases: list[TestCase]


class ExportResponse(BaseModel):
    run_id: str
    file_path: str
    question_count: int


class CreateQuestionResponse(BaseModel):
    run_id: str
    state: QuestionState = Field(description=_STATE_DESCRIPTION)
    statement: Statement
    code: str
    inputs: list[str]
    testcases: list[TestCase]
    export: ExportResponse


class QuestionDetail(BaseModel):
    """Everything the review screen needs, in one response."""

    run_id: str
    state: QuestionState = Field(description=_STATE_DESCRIPTION)
    statement: Statement
    code: str
    inputs: list[str]
    testcases: list[TestCase]
    metadata: RunMetadata


class QuestionStateResponse(BaseModel):
    """The state after a review action.

    Not the whole question: a question that failed verification can be rejected
    but has no complete set of artefacts to show.
    """

    run_id: str
    state: QuestionState = Field(description=_STATE_DESCRIPTION)


ApproverName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]


class ApproveRequest(BaseModel):
    """Who is approving. From the body until there is a session (G8-1)."""

    approved_by: ApproverName = Field(
        description="Name of the teacher responsible for the question. Required, not blank."
    )


_APPROVED_BY = "Who approved. Null until approved; a repeated approval keeps the first."
_APPROVED_AT = "When it was approved, ISO 8601 in UTC. Null until approved."
_REVIEWED = "True once a teacher approved the question."


class ApprovalResponse(QuestionStateResponse):
    """The state after an approval, and the approval record it left."""

    reviewed: bool = Field(description=_REVIEWED)
    approved_by: str | None = Field(description=_APPROVED_BY)
    approved_at: str | None = Field(description=_APPROVED_AT)


# ── Resource API under /api/v1 ───────────────────────────────────────────────
# Field names follow frontend/src/services/http/dto.ts, which validates every
# response with zod: a renamed field here is a ResponseShapeError on the screen.


class CreatedResponse(BaseModel):
    id: str


class JobView(BaseModel):
    """The background generation behind a question. See docs/adr/0017.

    An addition the client may ignore: zod drops unknown keys, and `status` keeps
    the five lifecycle values the screen already understands.
    """

    state: JobState = Field(
        description=(
            "EM_ANDAMENTO, INTERROMPIDO (the server restarted mid-job; resume it), "
            "FALHOU or CONCLUIDO. Not a question state."
        )
    )
    step: str | None = Field(
        default=None,
        description=(
            "statement, code, inputs, testcases or export: the step running, or the one "
            "running when the job stopped."
        ),
    )
    resumable: bool = Field(
        description="True only when INTERROMPIDO: POST /api/v1/questions/{id}/resume continues it."
    )
    updated_at: str = Field(description="ISO 8601, UTC: the last change to this record.")


class GenerationResponse(BaseModel):
    question_id: str
    run_id: str
    status: QuestionState = Field(description=_STATE_DESCRIPTION)
    completed_steps: int = Field(description="Steps finished, out of five.")
    failure_reason: str | None = Field(
        default=None, description="Why the generation stopped, for the teacher. No stack trace."
    )
    job: JobView


class ExampleView(BaseModel):
    input: str
    output: str


class StatementView(BaseModel):
    text: str
    input: str = Field(default="", description="The input block, split out of the stored text.")
    output: str = Field(default="", description="The output block, split out of the stored text.")
    example: ExampleView | None = Field(default=None, description="Always null for now.")


class StatementUpdate(BaseModel):
    """`PATCH /api/v1/questions/{id}/statement`: the parts the review screen edits."""

    model_config = ConfigDict(extra="ignore")

    text: str = Field(min_length=1, description="The statement body, without the title.")
    input: str = ""
    output: str = ""

    @field_validator("text")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("The statement text must not be blank.")
        return value


class MoodleExportRequest(BaseModel):
    question_ids: list[str] = Field(min_length=1, max_length=200)


class TestCaseView(BaseModel):
    id: str
    input: str
    expected_output: str
    actual_output: str | None = Field(default=None, description="Always null for now.")
    passed: bool | None = Field(default=None, description="Always null for now.")


class ConstraintCheckView(BaseModel):
    structure_id: str
    rule: Literal["required", "allowed", "forbidden"]
    satisfied: bool
    detail: str | None = None


class CompilationView(BaseModel):
    command: str
    succeeded: bool
    message: str


class QuestionSummary(BaseModel):
    """A question as the library card shows it. `QuestionResource` adds the rest."""

    id: str
    code: str
    title: str
    description: str
    content_id: str
    difficulty_min: int
    difficulty_max: int
    status: QuestionState = Field(description=_STATE_DESCRIPTION)
    test_case_count: int


class QuestionPage(BaseModel):
    """One page of `GET /api/v1/questions`, newest question first."""

    items: list[QuestionSummary]
    total: int = Field(description="Questions matching the filters, on every page together.")
    page: int = Field(description="This page, counted from 1. Past the end, `items` is empty.")
    page_size: int


class QuestionResource(QuestionSummary):
    """One question in any state; fields a step has not produced yet are empty."""

    statement: StatementView
    solution: str | None
    test_cases: list[TestCaseView]
    structures: StructureRules
    constraints: list[ConstraintCheckView] = Field(
        default_factory=list, description="Empty until the scope check exists (FEAT-024)."
    )
    compilation: CompilationView | None = Field(default=None, description="Always null for now.")
    failure_reason: str | None = None
    reviewed: bool = Field(default=False, description=_REVIEWED)
    approved_by: str | None = Field(default=None, description=_APPROVED_BY)
    approved_at: str | None = Field(default=None, description=_APPROVED_AT)
    job: JobView


__all__ = [
    "ApprovalResponse",
    "ApproveRequest",
    "CodeResponse",
    "ConfigResponse",
    "Constraints",
    "CreateQuestionRequest",
    "CreateQuestionResponse",
    "CreatedResponse",
    "Difficulty",
    "ExportResponse",
    "GenerationResponse",
    "HealthResponse",
    "InputRequest",
    "InputResponse",
    "JobView",
    "QuestionDetail",
    "QuestionPage",
    "QuestionResource",
    "QuestionState",
    "QuestionStateResponse",
    "QuestionSummary",
    "RunRequest",
    "StatementRequest",
    "StatementResponse",
    "TestCaseResponse",
]


# ── Session and accounts ──────────────────────────────────────────────────────
# Only upper bounds here. The rules themselves live in `codeexpert.accounts.policy`,
# which answers with one generic refusal; a 422 per field would say which rule
# an e-mail or invite broke.


class Credentials(BaseModel):
    email: str = Field(max_length=320)
    password: str = Field(max_length=128)


class Registration(BaseModel):
    name: str = Field(max_length=200)
    email: str = Field(max_length=320)
    password: str = Field(max_length=128)
    invite_code: str = Field(max_length=64)


class TeacherView(BaseModel):
    name: str
    department: str
