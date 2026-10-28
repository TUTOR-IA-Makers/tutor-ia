"""The provider key never reaches a log line or an error response.

Drives the real `OpenAIChatClient` through the API, with `httpx` replaced, so the
path covered is the one production takes: provider error text, into `LLMError`,
into the error handler's log line and the client's `detail`.
"""

import logging

import httpx
import pytest

from codeexpert.llm import get_llm_client
from codeexpert.llm.client import OpenAIChatClient
from codeexpert.settings import reset_settings_cache

pytestmark = pytest.mark.integration


@pytest.fixture
def key(isolated_settings) -> str:
    return isolated_settings.llm_api_key.get_secret_value()


@pytest.fixture
def real_client(client, monkeypatch):
    """The API with the production LLM client, failing fast instead of retrying."""
    monkeypatch.setenv("CODEEXPERT_LLM_MAX_RETRIES", "1")
    reset_settings_cache()
    client.app.dependency_overrides[get_llm_client] = OpenAIChatClient
    return client


def _leaks(key: str, text: str) -> bool:
    """True if any 10 consecutive characters of the key appear: a prefix is a leak too."""
    return any(key[i : i + 10] in text for i in range(len(key) - 9))


def _provider_echoing(key: str, *, padding: int = 0):
    """A provider that rejects the key and quotes it back, as some compatible ones do."""

    def answer(url: str, **_: object) -> httpx.Response:
        body = f"{'x' * padding}Incorrect API key provided: {key}"
        return httpx.Response(401, text=body, request=httpx.Request("POST", url))

    return answer


def _unreachable_provider(key: str):
    def answer(url: str, **_: object) -> httpx.Response:
        raise httpx.ConnectError(f"cannot connect with {key}")

    return answer


@pytest.mark.parametrize(
    "provider",
    [
        pytest.param(_provider_echoing, id="key-echoed-in-401-body"),
        # The key starts at offset 288 and crosses the 300-character cut, where
        # redacting after truncating would leave its first 12 characters.
        pytest.param(lambda key: _provider_echoing(key, padding=260), id="key-across-the-cut"),
        pytest.param(_unreachable_provider, id="key-in-transport-error"),
    ],
)
def test_failed_generation_does_not_leak_the_key(
    real_client, key, provider, monkeypatch, caplog
) -> None:
    monkeypatch.setattr(httpx, "post", provider(key))
    caplog.set_level(logging.DEBUG)

    response = real_client.post("/gen_statement", json={})

    assert response.status_code == 502
    assert not _leaks(key, response.text)
    assert not _leaks(key, caplog.text)


def test_config_verify_does_not_leak_the_key(client, key, monkeypatch, caplog) -> None:
    def answer(url: str, **_: object) -> httpx.Response:
        return httpx.Response(401, text=f"bad key {key}", request=httpx.Request("GET", url))

    monkeypatch.setattr(httpx, "get", answer)
    caplog.set_level(logging.DEBUG)

    response = client.get("/config", params={"verify": True})

    assert response.json()["provider_reachable"] is False
    assert not _leaks(key, response.text)
    assert not _leaks(key, caplog.text)
