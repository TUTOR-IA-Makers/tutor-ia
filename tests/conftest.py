"""Shared fixtures.

Two rules hold for the whole suite, and CI depends on them:

*   No test reaches the network. The model provider is always a `FakeLLM`.
*   No test writes outside `tmp_path`. Settings are redirected per test.

Tests that need a real compiler are marked `requires_gcc` and skip themselves
when `gcc` is absent, so the suite passes on a machine without a toolchain.
"""

import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from codeexpert.api.app import create_app
from codeexpert.execution import get_code_runner
from codeexpert.execution.runner import RunOutcome
from codeexpert.llm import get_llm_client
from codeexpert.settings import get_settings, reset_settings_cache
from codeexpert.workspace import RunWorkspace

GCC_AVAILABLE = shutil.which("gcc") is not None
requires_gcc = pytest.mark.skipif(not GCC_AVAILABLE, reason="no gcc on PATH")


class FakeLLM:
    """Returns scripted answers in order and records what it was asked."""

    def __init__(self, responses: list[str]) -> None:
        self._responses = list(responses)
        self.calls: list[tuple[str, str]] = []

    def complete(self, *, system: str, user: str, temperature: float = 0.7) -> str:
        self.calls.append((system, user))
        if not self._responses:
            raise AssertionError("FakeLLM ran out of scripted responses")
        return self._responses.pop(0)


class FakeRunner:
    """Pretends to compile, and echoes a deterministic transform of the input."""

    def __init__(self, *, fail_compile: str | None = None, timeout_on: str | None = None) -> None:
        self.fail_compile = fail_compile
        self.timeout_on = timeout_on
        self.compiled: list[Path] = []

    def compile(self, source: Path, binary: Path) -> None:
        from codeexpert.errors import CompilationError

        if self.fail_compile is not None:
            raise CompilationError(self.fail_compile)
        self.compiled.append(source)
        binary.write_text("fake-binary", encoding="utf-8")

    def run(self, binary: Path, stdin: str) -> RunOutcome:
        if self.timeout_on is not None and stdin == self.timeout_on:
            return RunOutcome("", "", -1, timed_out=True, truncated=False)
        return RunOutcome(f"out:{stdin.strip()}\n", "", 0, timed_out=False, truncated=False)


@pytest.fixture(autouse=True)
def isolated_settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Point every path at tmp_path and guarantee a key is never read from disk."""
    monkeypatch.setenv("CODEEXPERT_WORKSPACE_ROOT", str(tmp_path / "runs"))
    monkeypatch.setenv("CODEEXPERT_QUESTIONS_DIR", str(tmp_path / "questions"))
    monkeypatch.setenv("CODEEXPERT_LLM_API_KEY", "sk-test-not-a-real-key")
    monkeypatch.setenv("CODEEXPERT_LLM_MODEL", "fake-model")
    monkeypatch.setenv("CODEEXPERT_RUN_TIMEOUT_SECONDS", "3")
    reset_settings_cache()
    yield get_settings()
    reset_settings_cache()


@pytest.fixture
def workspace(isolated_settings) -> RunWorkspace:
    isolated_settings.workspace_root.mkdir(parents=True, exist_ok=True)
    return RunWorkspace.create(isolated_settings.workspace_root)


@pytest.fixture
def statement_response() -> str:
    return (
        "[Soma de dois numeros]\n"
        "Leia dois numeros inteiros e escreva a soma.\n"
        "[Descricao das entradas]\n"
        "Dois inteiros, um por linha.\n"
        "[Descricao das saidas]\n"
        "A soma dos dois."
    )


@pytest.fixture
def client(isolated_settings):
    """A TestClient whose external effects are all fakes."""
    app = create_app()
    fake_llm = FakeLLM([])
    fake_runner = FakeRunner()
    app.dependency_overrides[get_llm_client] = lambda: fake_llm
    app.dependency_overrides[get_code_runner] = lambda: fake_runner
    with TestClient(app) as test_client:
        test_client.fake_llm = fake_llm
        test_client.fake_runner = fake_runner
        yield test_client
