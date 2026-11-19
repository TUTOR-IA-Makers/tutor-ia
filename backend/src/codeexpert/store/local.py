"""One directory per run on the local disk.

This is the layout the repository already used under `var/runs/`, moved behind
`ArtifactStore`. It is the default for development and the backend offline tests
run against. See docs/adr/0012.
"""

import shutil
from collections.abc import Collection
from pathlib import Path

from codeexpert.domain import QuestionState, RunMetadata
from codeexpert.lifecycle import INITIAL_STATE
from codeexpert.store.base import RunListing

# Not artefact names, so they cannot collide with one of the pipeline's files.
COMPLETE_MARKER = ".complete"
STATE_FILE = ".state"
META = "meta.json"


class LocalFilesystemStore:
    def __init__(self, root: Path) -> None:
        self._root = root

    def _dir(self, run_id: str) -> Path:
        return self._root / run_id

    def create_run(self, run_id: str) -> None:
        self._dir(run_id).mkdir(parents=True, exist_ok=False)

    def run_exists(self, run_id: str) -> bool:
        return self._dir(run_id).is_dir()

    def put(self, run_id: str, name: str, content: str) -> None:
        (self._dir(run_id) / name).write_text(content, encoding="utf-8")

    def get(self, run_id: str, name: str) -> str | None:
        path = self._dir(run_id) / name
        return path.read_text(encoding="utf-8") if path.is_file() else None

    def delete_run(self, run_id: str) -> None:
        shutil.rmtree(self._dir(run_id), ignore_errors=True)

    def mark_complete(self, run_id: str) -> None:
        (self._dir(run_id) / COMPLETE_MARKER).touch()

    def is_complete(self, run_id: str) -> bool:
        return (self._dir(run_id) / COMPLETE_MARKER).is_file()

    def get_state(self, run_id: str) -> QuestionState:
        path = self._dir(run_id) / STATE_FILE
        if path.is_file():
            return QuestionState(path.read_text(encoding="utf-8").strip())
        # Runs written before the lifecycle existed have no state file. A finished
        # one is a generated question nobody has reviewed yet.
        return QuestionState.GERADA if self.is_complete(run_id) else INITIAL_STATE

    def set_state(self, run_id: str, expected: QuestionState, new: QuestionState) -> bool:
        # Check-then-write is not atomic across processes. Acceptable for the
        # development backend; the Postgres store does it in one statement.
        if self.get_state(run_id) is not expected:
            return False
        (self._dir(run_id) / STATE_FILE).write_text(new.value, encoding="utf-8")
        return True

    def record_approval(self, run_id: str, expected: QuestionState, metadata: RunMetadata) -> bool:
        if self.get_state(run_id) is not expected:
            return False
        # Record first, state second: a crash in between leaves a question that is
        # still GERADA, and approving it again overwrites the orphaned record.
        self.put(run_id, META, metadata.model_dump_json(indent=2) + "\n")
        return self.set_state(run_id, expected, QuestionState.APROVADA)

    def list_runs(self, names: Collection[str]) -> list[RunListing]:
        if not self._root.is_dir():
            # Nothing has been generated yet on this machine.
            return []
        listings = []
        for directory in self._root.iterdir():
            if not directory.is_dir():
                continue
            run_id = directory.name
            artifacts = {
                name: content for name in names if (content := self.get(run_id, name)) is not None
            }
            listings.append(RunListing(run_id, self.get_state(run_id), artifacts))
        return listings
