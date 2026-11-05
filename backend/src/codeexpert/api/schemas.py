"""Wire contracts.

Separate from `codeexpert.domain` on purpose: the entities are free to change
shape without silently changing the API, and every response carries the `run_id`
so a client can drive the pipeline one step at a time.
"""

from typing import Literal

from pydantic import BaseModel, Field

from codeexpert.api.drafts import StructureRules
from codeexpert.domain import Constraints, Difficulty, RunMetadata, Statement, TestCase


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
    statement: Statement
    code: str
    inputs: list[str]
    testcases: list[TestCase]
    export: ExportResponse


class QuestionDetail(BaseModel):
    """Everything the review screen needs, in one response."""

    run_id: str
    statement: Statement
    code: str
    inputs: list[str]
    testcases: list[TestCase]
    metadata: RunMetadata


# ── Resource API under /api/v1 ───────────────────────────────────────────────
# Field names follow frontend/src/services/http/dto.ts, which validates every
# response with zod: a renamed field here is a ResponseShapeError on the screen.

# The three states a generation can be in today. The front-end also knows
# APROVADA and REJEITADA; nothing produces them yet (G3-1).
QuestionStatus = Literal["GERANDO", "GERADA", "FALHOU_VERIFICACAO"]


class CreatedResponse(BaseModel):
    id: str


class GenerationResponse(BaseModel):
    question_id: str
    run_id: str
    status: QuestionStatus
    completed_steps: int = Field(description="Steps finished, out of five.")
    failure_reason: str | None = Field(
        default=None, description="Why the generation stopped, for the teacher. No stack trace."
    )


class ExampleView(BaseModel):
    input: str
    output: str


class StatementView(BaseModel):
    text: str
    input: str = Field(default="", description="Not split out of `text` yet; always empty.")
    output: str = Field(default="", description="Not split out of `text` yet; always empty.")
    example: ExampleView | None = Field(default=None, description="Always null for now.")


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


class QuestionResource(BaseModel):
    """One question in any state; fields a step has not produced yet are empty."""

    id: str
    code: str
    title: str
    description: str
    content_id: str
    difficulty_min: int
    difficulty_max: int
    status: QuestionStatus
    test_case_count: int
    statement: StatementView
    solution: str | None
    test_cases: list[TestCaseView]
    structures: StructureRules
    constraints: list[ConstraintCheckView] = Field(
        default_factory=list, description="Empty until the scope check exists (FEAT-024)."
    )
    compilation: CompilationView | None = Field(default=None, description="Always null for now.")
    failure_reason: str | None = None


__all__ = [
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
    "QuestionDetail",
    "QuestionResource",
    "RunRequest",
    "StatementRequest",
    "StatementResponse",
    "TestCaseResponse",
]
