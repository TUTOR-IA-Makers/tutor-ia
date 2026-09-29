"""HTTP surface. The only layer that knows FastAPI exists."""

from codeexpert.api.app import create_app

__all__ = ["create_app"]
