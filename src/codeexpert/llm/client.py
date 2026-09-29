"""The only place in the package that talks to a model provider.

Everything else depends on the `LLMClient` protocol, which is what makes the
generation steps testable without a network or an API key: tests inject a fake
that returns recorded answers.
"""

import logging
import time
from typing import Protocol

import httpx

from codeexpert.errors import LLMError
from codeexpert.settings import Settings, get_settings

logger = logging.getLogger(__name__)

RETRYABLE_STATUS = frozenset({408, 409, 429, 500, 502, 503, 504})


class LLMClient(Protocol):
    """Single-turn chat completion."""

    def complete(self, *, system: str, user: str, temperature: float = 0.7) -> str: ...


class OpenAIChatClient:
    """OpenAI-compatible `/chat/completions` client with bounded retries.

    Retries exist because an unavailable provider aborting a five-step pipeline
    at step four wastes the work of the first three (risk R7). They are bounded
    and only cover transient statuses — a 401 fails immediately.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def complete(self, *, system: str, user: str, temperature: float = 0.7) -> str:
        settings = self._settings
        api_key = settings.require_api_key()
        payload = {
            "model": settings.llm_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"

        last_error: str = "no attempt was made"
        for attempt in range(1, settings.llm_max_retries + 1):
            try:
                response = httpx.post(
                    url,
                    json=payload,
                    headers=headers,
                    timeout=settings.llm_timeout_seconds,
                )
            except httpx.RequestError as exc:
                last_error = f"request failed: {exc}"
            else:
                if response.status_code == httpx.codes.OK:
                    return _extract_content(response.json())
                last_error = f"HTTP {response.status_code}: {response.text[:300]}"
                if response.status_code not in RETRYABLE_STATUS:
                    break

            if attempt < settings.llm_max_retries:
                backoff = 2.0 ** (attempt - 1)
                logger.warning(
                    "LLM call failed (attempt %d/%d), retrying in %.0fs — %s",
                    attempt,
                    settings.llm_max_retries,
                    backoff,
                    last_error,
                )
                time.sleep(backoff)

        raise LLMError(f"Call to the model provider failed — {last_error}")


def _extract_content(body: dict) -> str:
    try:
        return body["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError, AttributeError) as exc:
        raise LLMError(f"Unexpected response shape from the provider: {body!r}") from exc


def get_llm_client() -> LLMClient:
    """FastAPI dependency. Overridden in tests with a fake."""
    return OpenAIChatClient()
