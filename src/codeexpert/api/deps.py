"""FastAPI dependencies.

Every external effect the routes need — the model provider, the compiler, the
artefact store — arrives through one of these, so a test overrides three
functions instead of patching modules.
"""

from typing import Annotated

from fastapi import Depends

from codeexpert.execution import CodeRunner, get_code_runner
from codeexpert.llm import LLMClient, get_llm_client
from codeexpert.settings import Settings, get_settings
from codeexpert.store import ArtifactStore, build_store
from codeexpert.workspace import RunWorkspace

SettingsDep = Annotated[Settings, Depends(get_settings)]
LLMDep = Annotated[LLMClient, Depends(get_llm_client)]
RunnerDep = Annotated[CodeRunner, Depends(get_code_runner)]


def get_store(settings: SettingsDep) -> ArtifactStore:
    return build_store(settings)


StoreDep = Annotated[ArtifactStore, Depends(get_store)]


def open_run(run_id: str, store: ArtifactStore) -> RunWorkspace:
    return RunWorkspace.open(store, run_id)


def create_run(store: ArtifactStore) -> RunWorkspace:
    return RunWorkspace.create(store)
