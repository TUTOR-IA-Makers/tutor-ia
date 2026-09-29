"""Run isolation, and the path-traversal guard on client-supplied run ids."""

from pathlib import Path

import pytest

from codeexpert.errors import MissingArtefactError, RunNotFoundError
from codeexpert.workspace import RUN_ID_PATTERN, STATEMENT, RunWorkspace, new_run_id


def test_two_runs_do_not_share_state(tmp_path: Path) -> None:
    first = RunWorkspace.create(tmp_path)
    second = RunWorkspace.create(tmp_path)

    first.write_text(STATEMENT, "first")
    second.write_text(STATEMENT, "second")

    assert first.run_id != second.run_id
    assert first.read_text(STATEMENT) == "first"
    assert second.read_text(STATEMENT) == "second"


def test_run_ids_match_the_expected_shape() -> None:
    run_id = new_run_id()
    assert RUN_ID_PATTERN.match(run_id), run_id
    # The timestamp prefix is fixed-width, so lexical order is chronological order.
    assert run_id[:16] <= new_run_id()[:16]


def test_open_rejects_unknown_run(tmp_path: Path) -> None:
    with pytest.raises(RunNotFoundError):
        RunWorkspace.open(tmp_path, "20260918T120000Z-deadbeef")


@pytest.mark.parametrize(
    "malicious",
    ["../../etc", "..", "a/../../b", "20260918T120000Z-deadbeef/../..", "/etc/passwd"],
)
def test_open_rejects_path_traversal(tmp_path: Path, malicious: str) -> None:
    with pytest.raises(RunNotFoundError):
        RunWorkspace.open(tmp_path, malicious)


def test_require_names_the_step_that_has_not_run(workspace: RunWorkspace) -> None:
    with pytest.raises(MissingArtefactError) as exc:
        workspace.require(STATEMENT)
    assert "POST /gen_statement" in str(exc.value)


def test_metadata_round_trips(workspace: RunWorkspace) -> None:
    metadata = workspace.read_metadata()
    metadata.reviewed = True
    workspace.write_metadata(metadata)
    assert workspace.read_metadata().reviewed is True
