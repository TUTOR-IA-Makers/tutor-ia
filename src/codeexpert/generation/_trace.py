"""Recording which model and prompt produced each artefact."""

from datetime import UTC, datetime

from codeexpert.domain import StepRecord
from codeexpert.settings import get_settings
from codeexpert.workspace import RunWorkspace


def record_step(workspace: RunWorkspace, step: str, prompt_version: str | None = None) -> None:
    """Append a step to the run's `meta.json`.

    Traceability is a hard requirement of EPIC-017 and a prerequisite for three
    other gaps (scope checking, the human approval gate, cost accounting), so it
    is written as the work happens rather than reconstructed later.
    """
    metadata = workspace.read_metadata()
    metadata.steps.append(
        StepRecord(
            step=step,
            prompt_version=prompt_version,
            model=get_settings().llm_model if prompt_version else None,
            finished_at=datetime.now(UTC).isoformat(),
        )
    )
    workspace.write_metadata(metadata)
