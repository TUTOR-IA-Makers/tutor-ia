"""Application factory.

A factory rather than a module-level singleton, so tests build an app with
overridden dependencies instead of mutating a global.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from codeexpert import __version__
from codeexpert.accounts import AuthLimits
from codeexpert.api.errors import register_error_handlers
from codeexpert.api.routes import catalog, health, questions, resources, session
from codeexpert.api.spa import mount_spa
from codeexpert.generation.job import recover_interrupted_jobs
from codeexpert.settings import get_settings
from codeexpert.store import build_store

logger = logging.getLogger(__name__)

DESCRIPTION = """
Generates C programming exercises — statement, reference solution, test inputs
and expected outputs — and exports them as Moodle CodeRunner XML.

Expected outputs come from compiling and running the solution, never from the
model. Everything else is assisted generation that a human must review.
"""


def _recover_interrupted_jobs() -> None:
    """A job left EM_ANDAMENTO by the previous process becomes INTERROMPIDO (G0-8).

    Never stops the server from starting: like /config reporting a missing key,
    a store that cannot be reached is logged and the rest of the site still
    serves. The jobs stay EM_ANDAMENTO until a start that reaches the store.
    """
    try:
        recover_interrupted_jobs(build_store(get_settings()))
    except Exception:
        logger.exception("Could not look for interrupted generations; they still read as running")


@asynccontextmanager
async def _lifespan(_: FastAPI) -> AsyncIterator[None]:
    _recover_interrupted_jobs()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Milani", version=__version__, description=DESCRIPTION, lifespan=_lifespan)
    register_error_handlers(app)
    # Per app, not per module: each test's app starts with no failed attempts.
    app.state.auth_limits = AuthLimits()
    app.include_router(health.router)
    app.include_router(catalog.router)
    app.include_router(questions.router)
    app.include_router(resources.router)
    app.include_router(session.router)

    # Last, so the SPA's catch-all only sees what the API routes left behind.
    frontend_dir = get_settings().frontend_dir
    if frontend_dir is not None:
        mount_spa(app, frontend_dir)
    else:

        @app.get("/", include_in_schema=False)
        async def root() -> RedirectResponse:
            return RedirectResponse(url="/docs")

    return app


app = create_app()
