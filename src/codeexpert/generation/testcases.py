"""Step 4 — expected outputs, obtained by running the program.

The one step that produces ground truth rather than model output. This is the
prototype's version of the rule that governs the whole platform: what can be
verified by execution is never predicted by a model.
"""

import logging

from codeexpert.domain import TestCase
from codeexpert.errors import ExecutionError
from codeexpert.execution import CodeRunner
from codeexpert.generation._trace import record_step
from codeexpert.workspace import BINARY, INPUTS, SOLUTION, TESTCASES, RunWorkspace

logger = logging.getLogger(__name__)


def generate_testcases(workspace: RunWorkspace, runner: CodeRunner) -> list[TestCase]:
    source = workspace.require(SOLUTION)
    inputs: list[str] = workspace.read_json(INPUTS)["inputs"]
    binary = workspace.path(BINARY)

    runner.compile(source, binary)

    testcases: list[TestCase] = []
    for index, stdin in enumerate(inputs):
        outcome = runner.run(binary, stdin)
        if outcome.timed_out:
            raise ExecutionError(
                f"Input {index + 1} of {len(inputs)} did not terminate within the time "
                "limit. The generated solution probably loops forever on it; regenerate "
                "the solution or drop the input."
            )
        testcases.append(TestCase(input=stdin, output=outcome.stdout))

    workspace.write_json(TESTCASES, {"testcases": [case.model_dump() for case in testcases]})
    record_step(workspace, "testcases")

    logger.info("Test cases saved to %s", workspace.path(TESTCASES))
    return testcases
