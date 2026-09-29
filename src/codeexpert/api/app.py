"""Application factory.

A factory rather than a module-level singleton, so tests build an app with
overridden dependencies instead of mutating a global.
"""

import logging

from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from codeexpert import __version__
from codeexpert.api.errors import register_error_handlers
from codeexpert.api.routes import health, questions

logger = logging.getLogger(__name__)

DESCRIPTION = """
Generates C programming exercises — statement, reference solution, test inputs
and expected outputs — and exports them as Moodle CodeRunner XML.

Expected outputs come from compiling and running the solution, never from the
model. Everything else is assisted generation that a human must review.
"""


def create_app() -> FastAPI:
    app = FastAPI(title="CodeExpert", version=__version__, description=DESCRIPTION)
    register_error_handlers(app)
    app.include_router(health.router)
    app.include_router(questions.router)

    @app.get("/", include_in_schema=False)
    async def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    return app


app = create_app()
