"""Domain exception to HTTP status, in one table.

Previously every endpoint repeated the same four-branch `try/except`. Any step
that forgot a branch returned a 500 for a client error. Registering handlers
once means a new service exception is mapped in one place, and services stay
free of `HTTPException`.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from codeexpert.errors import (
    CodeExpertError,
    CompilationError,
    ConfigurationError,
    ExecutionError,
    LLMError,
    MissingArtefactError,
    RunNotFoundError,
)

logger = logging.getLogger(__name__)

STATUS_BY_ERROR: list[tuple[type[CodeExpertError], int]] = [
    (RunNotFoundError, 404),
    (MissingArtefactError, 409),  # the run exists; the client called steps out of order
    (ConfigurationError, 503),  # the server is not ready, not the client's fault
    (LLMError, 502),  # an upstream dependency failed
    (CompilationError, 422),  # the generated artefact is unusable
    (ExecutionError, 422),
]


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(CodeExpertError)
    async def handle(_: Request, exc: CodeExpertError) -> JSONResponse:
        status = next(
            (code for error_type, code in STATUS_BY_ERROR if isinstance(exc, error_type)),
            500,
        )
        if status >= 500:
            logger.exception("Request failed with %d", status, exc_info=exc)
        else:
            logger.info("Request rejected with %d: %s", status, exc)
        content: dict[str, str] = {"detail": str(exc)}
        if exc.run_id is not None:
            content["run_id"] = exc.run_id
        return JSONResponse(status_code=status, content=content)
