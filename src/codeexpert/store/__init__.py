"""Where a generation run's artefacts are kept."""

from codeexpert.settings import Settings
from codeexpert.store.base import ArtifactStore
from codeexpert.store.local import LocalFilesystemStore

__all__ = ["ArtifactStore", "LocalFilesystemStore", "build_store"]


def build_store(settings: Settings) -> ArtifactStore:
    return LocalFilesystemStore(settings.workspace_root)
