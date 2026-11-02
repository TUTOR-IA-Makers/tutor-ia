"""Where a generation run's artefacts are kept."""

from codeexpert.store.base import ArtifactStore
from codeexpert.store.local import LocalFilesystemStore

__all__ = ["ArtifactStore", "LocalFilesystemStore"]
