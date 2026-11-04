"""Where a generation run's artefacts are kept."""

from codeexpert.settings import Settings
from codeexpert.store.base import ArtifactStore
from codeexpert.store.local import LocalFilesystemStore

__all__ = ["ArtifactStore", "LocalFilesystemStore", "build_store"]

# A Postgres store owns a connection pool, so it is built once per database. The
# local store is only a path and costs nothing, which lets tests redirect it freely.
_postgres_stores: dict[str, ArtifactStore] = {}


def build_store(settings: Settings) -> ArtifactStore:
    if settings.store_backend == "local":
        return LocalFilesystemStore(settings.workspace_root)

    dsn = settings.require_database_url()
    if dsn not in _postgres_stores:
        # Imported here so a laptop running the local store never needs the driver.
        from codeexpert.store.postgres import PostgresStore

        _postgres_stores[dsn] = PostgresStore(dsn)
    return _postgres_stores[dsn]
