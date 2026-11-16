"""Step 4 — expected outputs, obtained by running the program.

The one step that produces ground truth rather than model output. This is the
prototype's version of the rule that governs the whole platform: what can be
verified by execution is never predicted by a model.
"""

import logging
import tempfile
from pathlib import Path

from codeexpert.domain import QuestionState, TestCase
from codeexpert.errors import CompilationError, ExecutionError
from codeexpert.execution import CodeRunner
from codeexpert.generation._trace import record_step
from codeexpert.workspace import BINARY, INPUTS, SOLUTION, TESTCASES, RunWorkspace

logger = logging.getLogger(__name__)


class _VerificationTimeout(ExecutionError):
    """The solution did not finish on an input: the question's fault, not the server's."""


def _run_solution(workspace: RunWorkspace, runner: CodeRunner) -> list[TestCase]:
    code = workspace.read_text(SOLUTION)
    inputs: list[str] = workspace.read_json(INPUTS)["inputs"]

    # The compiler needs a file, and nothing else does: the disk is scratch space
    # for this step alone, and the directory is gone when it ends, failed or not.
    # Cleanup errors are ignored so they never replace the step's own error: on
    # Windows a program killed on timeout can still hold its .exe for a moment.
    # See docs/adr/0012.
    testcases: list[TestCase] = []
    with tempfile.TemporaryDirectory(
        prefix=f"{workspace.run_id}-", ignore_cleanup_errors=True
    ) as scratch:
        source = Path(scratch) / SOLUTION
        binary = Path(scratch) / BINARY
        source.write_text(code, encoding="utf-8")

        runner.compile(source, binary)

        for index, stdin in enumerate(inputs):
            outcome = runner.run(binary, stdin)
            if outcome.timed_out:
                raise _VerificationTimeout(
                    f"Input {index + 1} of {len(inputs)} did not terminate within the time "
                    "limit. The generated solution probably loops forever on it; regenerate "
                    "the solution or drop the input."
                )
            testcases.append(TestCase(input=stdin, output=outcome.stdout))
    return testcases


def generate_testcases(workspace: RunWorkspace, runner: CodeRunner) -> list[TestCase]:
    """Compile and run the solution; this is the step that verifies the question.

    A solution that does not compile, or that does not finish on an input, puts
    the question in `FALHOU_VERIFICACAO`, which is what keeps it from ever being
    approved. Running this step again is the retry, so it starts by putting such
    a question back in `GERANDO`. A missing compiler (an `ExecutionError` raised
    by the runner, not by this step) is the server's fault and changes nothing.
    See docs/adr/0015.
    """
    if workspace.state is QuestionState.FALHOU_VERIFICACAO:
        workspace.transition(QuestionState.GERANDO)

    try:
        testcases = _run_solution(workspace, runner)
    except (CompilationError, _VerificationTimeout):
        # A question already generated or reviewed keeps its state: this
        # failure wrote nothing, so the stored question is still the one judged.
        if workspace.state is QuestionState.GERANDO:
            workspace.transition(QuestionState.FALHOU_VERIFICACAO)
        raise

    workspace.write_json(TESTCASES, {"testcases": [case.model_dump() for case in testcases]})
    record_step(workspace, "testcases")

    logger.info("Run %s — test cases saved", workspace.run_id)
    return testcases
