"""The scope of a single generation run.

The previous design kept every intermediate artefact in a single `cache/`
directory, cleared at the start of each run. Two concurrent requests corrupted
each other's state, and the directory was tracked by git. Both problems go away
when the run id scopes every read and write. See docs/adr/0003.

Where the artefacts live is the `ArtifactStore`'s business, not this class's:
a workspace never holds a path, so a run can be opened by a process that never
saw its files. See docs/adr/0012.
"""

import json
import re
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from codeexpert.domain import RunMetadata
from codeexpert.errors import MissingArtefactError, RunNotFoundError
from codeexpert.store import ArtifactStore

STATEMENT = "statement.json"
SOLUTION = "solution.c"
BINARY = "solution"
INPUTS = "inputs.json"
TESTCASES = "testcases.json"
META = "meta.json"
# What the teacher asked for, verbatim. The constraints derived from it lose
# information (ten contents become four axes), so the original is kept.
DRAFT = "draft.json"
# Present only when a background generation stopped before completing.
FAILURE = "failure.json"

# Run ids come from clients as path segments. Anything outside this alphabet is
# rejected before it reaches the filesystem.
RUN_ID_PATTERN = re.compile(r"^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}$")

_HINTS = {
    STATEMENT: "Generate a statement first (POST /gen_statement).",
    SOLUTION: "Generate a solution first (POST /gen_code).",
    INPUTS: "Generate inputs first (POST /gen_inputs).",
    TESTCASES: "Generate test cases first (POST /gen_testcases).",
}


def new_run_id() -> str:
    """Time-ordered id, so listing the workspace sorts chronologically."""
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    return f"{stamp}-{uuid4().hex[:8]}"


class RunWorkspace:
    """The artefacts of a single generation run, read and written through a store."""

    def __init__(self, run_id: str, store: ArtifactStore) -> None:
        self.run_id = run_id
        self._store = store

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    @classmethod
    def create(cls, store: ArtifactStore) -> "RunWorkspace":
        run_id = new_run_id()
        store.create_run(run_id)
        workspace = cls(run_id, store)
        workspace.write_metadata(
            RunMetadata(run_id=run_id, created_at=datetime.now(UTC).isoformat())
        )
        return workspace

    @classmethod
    def open(cls, store: ArtifactStore, run_id: str) -> "RunWorkspace":
        if not RUN_ID_PATTERN.match(run_id):
            raise RunNotFoundError(f"'{run_id}' is not a valid run id.")
        if not store.run_exists(run_id):
            raise RunNotFoundError(
                f"Run '{run_id}' not found. Start a new one with POST /gen_statement."
            )
        return cls(run_id, store)

    def delete(self) -> None:
        self._store.delete_run(self.run_id)

    def complete(self) -> None:
        """Mark the run finished. Until then it is a draft and no question is shown."""
        self._store.mark_complete(self.run_id)

    def is_complete(self) -> bool:
        return self._store.is_complete(self.run_id)

    # ── Artefacts ─────────────────────────────────────────────────────────────

    def exists(self, name: str) -> bool:
        return self._store.get(self.run_id, name) is not None

    def read_text(self, name: str) -> str:
        """Return an artefact, or say which step has not run yet."""
        content = self._store.get(self.run_id, name)
        if content is None:
            hint = _HINTS.get(name, "A previous pipeline step has not run.")
            raise MissingArtefactError(f"'{name}' not found in run {self.run_id}. {hint}")
        return content

    def write_text(self, name: str, content: str) -> None:
        self._store.put(self.run_id, name, content)

    def read_json(self, name: str) -> Any:
        return json.loads(self.read_text(name))

    def write_json(self, name: str, payload: Any) -> None:
        self.write_text(name, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")

    # ── Traceability ──────────────────────────────────────────────────────────

    def read_metadata(self) -> RunMetadata:
        content = self._store.get(self.run_id, META)
        if content is None:
            return RunMetadata(run_id=self.run_id, created_at=datetime.now(UTC).isoformat())
        return RunMetadata.model_validate_json(content)

    def write_metadata(self, metadata: RunMetadata) -> None:
        self.write_text(META, metadata.model_dump_json(indent=2) + "\n")
