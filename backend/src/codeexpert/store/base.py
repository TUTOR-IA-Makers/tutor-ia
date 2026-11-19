"""The seam where the run's artefacts move from disk to Postgres.

`RunWorkspace` reads and writes through this protocol and never through a path,
so which backend holds the artefacts is a setting, not a code change. The same
idea as `CodeRunner` in docs/adr/0004. See docs/adr/0012.
"""

from collections.abc import Collection
from dataclasses import dataclass
from typing import Protocol

from codeexpert.domain import JobRecord, JobState, QuestionState, RunMetadata


@dataclass(frozen=True)
class RunListing:
    """One run as `list_runs` returns it: its state, its job and the artefacts asked for.

    `artifacts` holds only the requested names the run has; a missing step is
    an absent key, not an empty string. `job` is `None` when no background job
    was ever recorded, as `get_job` would say. It comes in the same call because
    the library shows a question whose job stopped as stopped (docs/adr/0017).
    """

    run_id: str
    state: QuestionState
    artifacts: dict[str, str]
    job: JobRecord | None = None


class ArtifactStore(Protocol):
    """Where a run's artefacts live, whether the run is finished, and its state.

    A run is `draft` from `create_run` until `mark_complete`. Nothing here
    enforces that only complete runs are shown; callers that list or serve
    questions check `is_complete`.

    The question state is stored here but never judged here: which transitions
    are allowed is `codeexpert.lifecycle`'s business. The store only promises that
    `set_state` does not overwrite a change it did not see.
    """

    def create_run(self, run_id: str) -> None:
        """Register a new run. Fails if the id already exists."""
        ...

    def run_exists(self, run_id: str) -> bool: ...

    def put(self, run_id: str, name: str, content: str) -> None:
        """Create or overwrite one artefact."""
        ...

    def get(self, run_id: str, name: str) -> str | None:
        """Return an artefact, or `None` when that step has not produced it."""
        ...

    def delete_run(self, run_id: str) -> None: ...

    def mark_complete(self, run_id: str) -> None: ...

    def is_complete(self, run_id: str) -> bool: ...

    def get_state(self, run_id: str) -> QuestionState:
        """The run's question state. `GERANDO` from `create_run` on."""
        ...

    def set_state(self, run_id: str, expected: QuestionState, new: QuestionState) -> bool:
        """Store `new` only if the state is still `expected`. Return whether it did."""
        ...

    def record_approval(self, run_id: str, expected: QuestionState, metadata: RunMetadata) -> bool:
        """Set `APROVADA` and store `metadata` as `meta.json`, together.

        Same compare-and-set as `set_state`: nothing is written unless the state is
        still `expected`. The state and the record of who approved never disagree.
        """
        ...

    # The background generation job (G0-8, docs/adr/0017). Its state is not the
    # question's state, and the store judges neither.

    def get_job(self, run_id: str) -> JobRecord | None:
        """The run's job record, or `None` when no background job was ever started."""
        ...

    def save_job(self, run_id: str, job: JobRecord) -> None:
        """Overwrite the job record. Only the job that owns the run calls this."""
        ...

    def replace_job(self, run_id: str, expected: JobState | None, job: JobRecord) -> bool:
        """Store `job` only if the stored state is still `expected` (`None`: no record).

        What stops two resumes of the same interrupted job from both starting one.
        """
        ...

    def interrupt_running_jobs(self) -> list[str]:
        """Move every `EM_ANDAMENTO` job to `INTERROMPIDO`; return their run ids.

        Called once when the process starts, when no job can be running in it.
        Keeps the step, so the record still says where the job stopped.
        """
        ...

    def list_runs(self, names: Collection[str]) -> list[RunListing]:
        """Every run, with its job and the artefacts in `names` it has. Order is unspecified.

        One call for the whole library, so a backend can answer it with one
        query instead of one round trip per run and artefact. Filtering and
        ordering are the caller's: the store does not know what a draft is.
        """
        ...
