"""FastAPI dependencies.

Every external effect the routes need — the model provider, the compiler, the
filesystem — arrives through one of these, so a test overrides three functions
instead of patching modules.
"""

from typing import Annotated

from fastapi import Depends

from codeexpert.execution import CodeRunner, get_code_runner
from codeexpert.llm import LLMClient, get_llm_client
from codeexpert.settings import Settings, get_settings
from codeexpert.workspace import RunWorkspace

SettingsDep = Annotated[Settings, Depends(get_settings)]
LLMDep = Annotated[LLMClient, Depends(get_llm_client)]
RunnerDep = Annotated[CodeRunner, Depends(get_code_runner)]


def open_run(run_id: str, settings: Settings) -> RunWorkspace:
    return RunWorkspace.open(settings.workspace_root, run_id)


def create_run(settings: Settings) -> RunWorkspace:
    settings.workspace_root.mkdir(parents=True, exist_ok=True)
    return RunWorkspace.create(settings.workspace_root)
