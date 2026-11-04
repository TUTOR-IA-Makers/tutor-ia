"""One directory per run on the local disk.

This is the layout the repository already used under `var/runs/`, moved behind
`ArtifactStore`. It is the default for development and the backend offline tests
run against. See docs/adr/0012.
"""

import shutil
from pathlib import Path

# Not an artefact name, so it cannot collide with one of the pipeline's files.
COMPLETE_MARKER = ".complete"


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
