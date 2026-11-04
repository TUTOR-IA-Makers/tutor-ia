"""The seam where the run's artefacts move from disk to Postgres.

`RunWorkspace` reads and writes through this protocol and never through a path,
so which backend holds the artefacts is a setting, not a code change. The same
idea as `CodeRunner` in docs/adr/0004. See docs/adr/0012.
"""

from typing import Protocol


class ArtifactStore(Protocol):
    """Where a run's artefacts live, and whether the run is finished.

    A run is `draft` from `create_run` until `mark_complete`. Nothing here
    enforces that only complete runs are shown; callers that list or serve
    questions check `is_complete`.
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
