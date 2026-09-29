"""Wire contracts.

Separate from `codeexpert.domain` on purpose: the entities are free to change
shape without silently changing the API, and every response carries the `run_id`
so a client can drive the pipeline one step at a time.
"""

from pydantic import BaseModel, Field

from codeexpert.domain import Constraints, Difficulty, Statement, TestCase


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


__all__ = [
    "CodeResponse",
    "ConfigResponse",
    "Constraints",
    "CreateQuestionRequest",
    "CreateQuestionResponse",
    "Difficulty",
    "ExportResponse",
    "HealthResponse",
    "InputRequest",
    "InputResponse",
    "RunRequest",
    "StatementRequest",
    "StatementResponse",
    "TestCaseResponse",
]
