"""The five steps, chained.

The previous orchestrator called its own HTTP endpoints through a
`fastapi.testclient.TestClient`, which made a production request path depend on
a testing utility and put the whole pipeline behind the network stack. It calls
the services directly now; the HTTP endpoints are one caller among several.
"""

import logging

from codeexpert.domain import Constraints, Statement, TestCase
from codeexpert.errors import CodeExpertError
from codeexpert.execution import CodeRunner
from codeexpert.export.moodle import ExportResult, export_question
from codeexpert.generation.codegen import generate_code
from codeexpert.generation.inputs import generate_inputs
from codeexpert.generation.statement import generate_statement
from codeexpert.generation.testcases import generate_testcases
from codeexpert.llm import LLMClient
from codeexpert.workspace import RunWorkspace

logger = logging.getLogger(__name__)


class QuestionResult:
    """What one full run produced. Plain container, deliberately not a model."""

    def __init__(
        self,
        run_id: str,
        statement: Statement,
        code: str,
        inputs: list[str],
        testcases: list[TestCase],
        export: ExportResult,
    ) -> None:
        self.run_id = run_id
        self.statement = statement
        self.code = code
        self.inputs = inputs
        self.testcases = testcases
        self.export = export


def create_question(
    workspace: RunWorkspace,
    constraints: Constraints,
    quantity: int,
    llm: LLMClient,
    runner: CodeRunner,
) -> QuestionResult:
    logger.info("Run %s — starting generation", workspace.run_id)

    try:
        statement = generate_statement(workspace, constraints, llm)
        code = generate_code(workspace, llm)
        inputs = generate_inputs(workspace, quantity, llm)
        testcases = generate_testcases(workspace, runner)
        export = export_question(workspace)
    except CodeExpertError as exc:
        # The steps already paid for stay in the workspace; without the id the
        # client cannot find them to resume.
        exc.run_id = workspace.run_id
        raise

    logger.info("Run %s — complete, exported to %s", workspace.run_id, export.file_path)
    return QuestionResult(workspace.run_id, statement, code, inputs, testcases, export)
