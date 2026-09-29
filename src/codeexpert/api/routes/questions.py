"""The generation pipeline over HTTP.

Every step after the first takes a `run_id`, which is what allows two people —
or two agents — to generate questions at the same time without overwriting each
other's intermediate files. See docs/adr/0003.

There is no `try/except` here by design: services raise domain exceptions and
`codeexpert.api.errors` maps them. An endpoint that needs its own handler is a
sign the exception belongs in that table instead.
"""

import logging

from fastapi import APIRouter

from codeexpert.api.deps import LLMDep, RunnerDep, SettingsDep, create_run, open_run
from codeexpert.api.schemas import (
    CodeResponse,
    CreateQuestionRequest,
    CreateQuestionResponse,
    ExportResponse,
    InputRequest,
    InputResponse,
    RunRequest,
    StatementRequest,
    StatementResponse,
    TestCaseResponse,
)
from codeexpert.domain import Constraints
from codeexpert.export import export_question
from codeexpert.generation import (
    create_question,
    generate_code,
    generate_inputs,
    generate_statement,
    generate_testcases,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["generation"])


@router.post("/gen_statement", response_model=StatementResponse)
async def gen_statement(
    request: StatementRequest, settings: SettingsDep, llm: LLMDep
) -> StatementResponse:
    """Step 1. Starts a new run unless `run_id` names an existing one."""
    workspace = open_run(request.run_id, settings) if request.run_id else create_run(settings)
    constraints = Constraints.model_validate(request.model_dump(exclude={"run_id"}))
    statement = generate_statement(workspace, constraints, llm)
    return StatementResponse(
        run_id=workspace.run_id, name=statement.name, statement=statement.statement
    )


@router.post("/gen_code", response_model=CodeResponse)
async def gen_code(request: RunRequest, settings: SettingsDep, llm: LLMDep) -> CodeResponse:
    """Step 2."""
    workspace = open_run(request.run_id, settings)
    return CodeResponse(run_id=workspace.run_id, code=generate_code(workspace, llm))


@router.post("/gen_inputs", response_model=InputResponse)
async def gen_inputs(request: InputRequest, settings: SettingsDep, llm: LLMDep) -> InputResponse:
    """Step 3."""
    workspace = open_run(request.run_id, settings)
    inputs = generate_inputs(workspace, request.qty, llm)
    return InputResponse(run_id=workspace.run_id, inputs=inputs)


@router.post("/gen_testcases", response_model=TestCaseResponse)
async def gen_testcases(
    request: RunRequest, settings: SettingsDep, runner: RunnerDep
) -> TestCaseResponse:
    """Step 4. The only step that produces ground truth instead of model output."""
    workspace = open_run(request.run_id, settings)
    return TestCaseResponse(
        run_id=workspace.run_id, testcases=generate_testcases(workspace, runner)
    )


@router.post("/export_moodle_xml_question", response_model=ExportResponse)
async def export_moodle_xml_question(request: RunRequest, settings: SettingsDep) -> ExportResponse:
    """Step 5. Appends to the questionnaire file rather than replacing it."""
    workspace = open_run(request.run_id, settings)
    result = export_question(workspace)
    return ExportResponse(
        run_id=workspace.run_id,
        file_path=str(result.file_path),
        question_count=result.question_count,
    )


@router.post("/create_question", response_model=CreateQuestionResponse)
async def create_question_endpoint(
    request: CreateQuestionRequest,
    settings: SettingsDep,
    llm: LLMDep,
    runner: RunnerDep,
) -> CreateQuestionResponse:
    """All five steps in one call."""
    workspace = (
        open_run(request.statement_request.run_id, settings)
        if request.statement_request.run_id
        else create_run(settings)
    )
    constraints = Constraints.model_validate(
        request.statement_request.model_dump(exclude={"run_id"})
    )
    quantity = request.input_request.qty if request.input_request else request.qty

    result = create_question(workspace, constraints, quantity, llm, runner)
    return CreateQuestionResponse(
        run_id=result.run_id,
        statement=result.statement,
        code=result.code,
        inputs=result.inputs,
        testcases=result.testcases,
        export=ExportResponse(
            run_id=result.run_id,
            file_path=str(result.export.file_path),
            question_count=result.export.question_count,
        ),
    )
