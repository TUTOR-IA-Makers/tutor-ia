"""Serve the built front-end from the same origin as the API.

G4-1: one image, one deploy, no CORS and no second domain. FastAPI matches its
own routes first; a GET nothing else claimed is either a file of the Vite build
or a route of the React router, which only `index.html` knows how to draw.
"""

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from codeexpert.errors import ConfigurationError

logger = logging.getLogger(__name__)

# Vite puts a content hash in every name under assets/: a name never changes
# content, so browsers may keep it for good.
_IMMUTABLE = "public, max-age=31536000, immutable"
# index.html names the current hashes. A stale copy would load the previous
# deploy's bundle, so the browser must revalidate it every time.
_REVALIDATE = "no-cache"


def _is_api(path: str) -> bool:
    # A client calling an endpoint that does not exist must get a JSON 404, not
    # a 200 page of HTML it will fail to parse.
    return path == "api" or path.startswith("api/")


def _is_asset(path: str) -> bool:
    return path.startswith("assets/")


def _file_in(root: Path, path: str) -> Path | None:
    # resolve() collapses `..` and symlinks; the containment check is what
    # stops `/../../etc/passwd` from reading outside the build.
    candidate = (root / path).resolve()
    if candidate.is_file() and candidate.is_relative_to(root):
        return candidate
    return None


def mount_spa(app: FastAPI, directory: Path) -> None:
    """Serve `directory` (a `frontend/dist`) for every GET no route claimed.

    Must run after every router is included: the catch-all only sees what they
    leave behind.
    """
    root = directory.resolve()
    index = root / "index.html"
    if not index.is_file():
        # Failing here keeps the container from turning healthy, so a broken
        # image stops the deploy instead of going live as a blank page.
        raise ConfigurationError(
            f"CODEEXPERT_FRONTEND_DIR is '{directory}', which has no index.html. "
            "Build the front-end (npm run build in frontend/) and point the "
            "variable at its dist/ directory, or unset it to serve the API alone."
        )

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str) -> FileResponse:
        if _is_api(path):
            raise HTTPException(status_code=404, detail="Not Found")
        file = _file_in(root, path) if path else None
        if file is not None:
            cache = _IMMUTABLE if _is_asset(path) else _REVALIDATE
            return FileResponse(file, headers={"Cache-Control": cache})
        if _is_asset(path):
            # A hash from an earlier deploy: answering with HTML would make the
            # browser report a MIME error instead of a missing file.
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(index, headers={"Cache-Control": _REVALIDATE})

    logger.info("Serving the front-end from %s", root)
