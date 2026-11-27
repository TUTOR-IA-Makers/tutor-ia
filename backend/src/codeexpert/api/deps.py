"""FastAPI dependencies.

Every external effect the routes need — the model provider, the compiler, the
artefact store — arrives through one of these, so a test overrides three
functions instead of patching modules.
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Request

from codeexpert.accounts import (
    AccountStore,
    AuthLimits,
    Teacher,
    build_account_store,
    session_token_hash,
)
from codeexpert.errors import ForbiddenRequestError, NotSignedInError
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


# ── Who is asking ─────────────────────────────────────────────────────────────

SESSION_COOKIE = "session"
# The value `frontend/src/lib/http/client.ts` sends. A form on another site
# cannot set a custom header, and a script there would need a CORS preflight
# this API never grants, so its presence closes form-based CSRF together with
# SameSite=Lax.
WEB_CLIENT_HEADER = "X-Requested-With"
WEB_CLIENT_VALUE = "codeexpert-web"
_SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})


def get_account_store(settings: SettingsDep) -> AccountStore:
    return build_account_store(settings)


AccountStoreDep = Annotated[AccountStore, Depends(get_account_store)]


def require_web_client(request: Request) -> None:
    if request.method in _SAFE_METHODS:
        return
    if request.headers.get(WEB_CLIENT_HEADER) != WEB_CLIENT_VALUE:
        raise ForbiddenRequestError(
            f"State-changing requests must send the header {WEB_CLIENT_HEADER}: {WEB_CLIENT_VALUE}."
        )


def get_current_teacher(request: Request, accounts: AccountStoreDep) -> Teacher:
    token = request.cookies.get(SESSION_COOKIE)
    teacher = (
        accounts.teacher_for_session(session_token_hash(token), datetime.now(UTC))
        if token
        else None
    )
    if teacher is None:
        raise NotSignedInError("Sign in to continue.")
    return teacher


CurrentTeacher = Annotated[Teacher, Depends(get_current_teacher)]


def get_auth_limits(request: Request) -> AuthLimits:
    return request.app.state.auth_limits


AuthLimitsDep = Annotated[AuthLimits, Depends(get_auth_limits)]
