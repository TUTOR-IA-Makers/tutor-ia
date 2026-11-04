"""The five steps chained, offline."""

import pytest

from codeexpert.domain import Constraints, Difficulty
from codeexpert.errors import ExecutionError
from codeexpert.execution import LocalGccRunner
from codeexpert.generation import create_question, generate_testcases
from codeexpert.workspace import META, RunWorkspace
from tests.conftest import FakeLLM, FakeRunner, requires_gcc

pytestmark = pytest.mark.integration

SOLUTION_SOURCE = """#include <stdio.h>
int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 1;
    printf("%d\\n", a + b);
    return 0;
}
"""


def _llm(statement_response: str) -> FakeLLM:
    return FakeLLM([statement_response, SOLUTION_SOURCE, '["1\\n2\\n", "10\\n20\\n"]'])


def test_full_run_writes_every_artefact(workspace: RunWorkspace, statement_response: str) -> None:
    result = create_question(
        workspace,
        Constraints(difficulty=Difficulty.FACIL),
        quantity=2,
        llm=_llm(statement_response),
        runner=FakeRunner(),
    )

    assert result.statement.name == "Soma de dois numeros"
    assert len(result.testcases) == 2
    assert result.export.file_path.exists()
    assert workspace.exists(META)


def test_metadata_records_model_and_prompt_versions(
    workspace: RunWorkspace, statement_response: str
) -> None:
    """Traceability is a prerequisite of the human approval gate (EPIC-017)."""
    create_question(
        workspace,
        Constraints(),
        quantity=1,
        llm=_llm(statement_response),
        runner=FakeRunner(),
    )

    metadata = workspace.read_metadata()
    assert [step.step for step in metadata.steps] == [
        "statement",
        "code",
        "inputs",
        "testcases",
    ]
    assert metadata.steps[0].model == "fake-model"
    assert metadata.steps[0].prompt_version
    assert metadata.constraints is not None
    assert metadata.reviewed is False


def test_a_non_terminating_input_is_reported_not_hung(
    workspace: RunWorkspace, statement_response: str
) -> None:
    with pytest.raises(ExecutionError, match="did not terminate"):
        create_question(
            workspace,
            Constraints(),
            quantity=2,
            llm=_llm(statement_response),
            runner=FakeRunner(timeout_on="1\n2\n"),
        )


@requires_gcc
def test_expected_outputs_come_from_real_execution(
    workspace: RunWorkspace, statement_response: str
) -> None:
    """The rule the whole product rests on: outputs are observed, not predicted."""
    result = create_question(
        workspace,
        Constraints(),
        quantity=2,
        llm=_llm(statement_response),
        runner=LocalGccRunner(),
    )
    assert [case.output for case in result.testcases] == ["3\n", "30\n"]


@requires_gcc
def test_an_infinite_loop_is_killed_by_the_timeout(workspace: RunWorkspace) -> None:
    """Without a timeout this test would never return — that was the old behaviour."""
    workspace.write_text("solution.c", "int main(void){ for(;;); }")
    workspace.write_json("inputs.json", {"inputs": [""]})

    with pytest.raises(ExecutionError, match="did not terminate"):
        generate_testcases(workspace, LocalGccRunner())


@requires_gcc
def test_code_that_does_not_compile_says_why(workspace: RunWorkspace) -> None:
    from codeexpert.errors import CompilationError

    workspace.write_text("solution.c", "int main(void) { this is not c }")
    workspace.write_json("inputs.json", {"inputs": [""]})

    with pytest.raises(CompilationError) as exc:
        generate_testcases(workspace, LocalGccRunner())
    assert "error" in str(exc.value).lower()
