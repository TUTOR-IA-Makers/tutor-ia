"""One directory per generation run.

The previous design kept every intermediate artefact in a single `cache/`
directory, cleared at the start of each run. Two concurrent requests corrupted
each other's state, and the directory was tracked by git. Both problems go away
when the run id is part of the path. See docs/adr/0003.
"""

import json
import re
import shutil
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from codeexpert.domain import RunMetadata
from codeexpert.errors import MissingArtefactError, RunNotFoundError

STATEMENT = "statement.json"
SOLUTION = "solution.c"
BINARY = "solution"
INPUTS = "inputs.json"
TESTCASES = "testcases.json"
META = "meta.json"

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
    """The filesystem scope of a single generation run."""

    def __init__(self, run_id: str, root: Path) -> None:
        self.run_id = run_id
        self.root = root

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    @classmethod
    def create(cls, workspace_root: Path) -> "RunWorkspace":
        run_id = new_run_id()
        root = workspace_root / run_id
        root.mkdir(parents=True, exist_ok=False)
        workspace = cls(run_id, root)
        workspace.write_metadata(
            RunMetadata(run_id=run_id, created_at=datetime.now(UTC).isoformat())
        )
        return workspace

    @classmethod
    def open(cls, workspace_root: Path, run_id: str) -> "RunWorkspace":
        if not RUN_ID_PATTERN.match(run_id):
            raise RunNotFoundError(f"'{run_id}' is not a valid run id.")
        root = workspace_root / run_id
        if not root.is_dir():
            raise RunNotFoundError(
                f"Run '{run_id}' not found. Start a new one with POST /gen_statement."
            )
        return cls(run_id, root)

    def delete(self) -> None:
        shutil.rmtree(self.root, ignore_errors=True)

    # ── Artefacts ─────────────────────────────────────────────────────────────

    def path(self, name: str) -> Path:
        return self.root / name

    def exists(self, name: str) -> bool:
        return self.path(name).exists()

    def require(self, name: str) -> Path:
        """Return an artefact's path, or say which step has not run yet."""
        path = self.path(name)
        if not path.exists():
            hint = _HINTS.get(name, "A previous pipeline step has not run.")
            raise MissingArtefactError(f"'{name}' not found in run {self.run_id}. {hint}")
        return path

    def write_text(self, name: str, content: str) -> Path:
        path = self.path(name)
        path.write_text(content, encoding="utf-8")
        return path

    def read_text(self, name: str) -> str:
        return self.require(name).read_text(encoding="utf-8")

    def write_json(self, name: str, payload: Any) -> Path:
        path = self.path(name)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return path

    def read_json(self, name: str) -> Any:
        return json.loads(self.read_text(name))

    # ── Traceability ──────────────────────────────────────────────────────────

    def read_metadata(self) -> RunMetadata:
        if not self.exists(META):
            return RunMetadata(run_id=self.run_id, created_at=datetime.now(UTC).isoformat())
        return RunMetadata.model_validate_json(self.read_text(META))

    def write_metadata(self, metadata: RunMetadata) -> None:
        self.write_text(META, metadata.model_dump_json(indent=2) + "\n")
