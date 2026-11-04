"""Shared fixtures.

Two rules hold for the whole suite, and CI depends on them:

*   No test reaches the network. The model provider is always a `FakeLLM`.
    The one exception is opt-in: the Postgres server named below.
*   No test writes outside `tmp_path`. Settings are redirected per test.

Tests that need a real compiler are marked `requires_gcc` and skip themselves
when `gcc` is absent, so the suite passes on a machine without a toolchain.

Tests that need Postgres skip themselves the same way when
`CODEEXPERT_TEST_DATABASE_URL` is unset. When it is set, they never touch the
database it names: each test session creates a database of its own on that
server, migrates it, and drops it at the end. See docs/adr/0013.
"""

import os
import shutil
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from codeexpert.api.app import create_app
from codeexpert.execution import get_code_runner
from codeexpert.execution.runner import RunOutcome
from codeexpert.llm import get_llm_client
from codeexpert.settings import get_settings, reset_settings_cache
from codeexpert.store import LocalFilesystemStore
from codeexpert.workspace import RunWorkspace

GCC_AVAILABLE = shutil.which("gcc") is not None
requires_gcc = pytest.mark.skipif(not GCC_AVAILABLE, reason="no gcc on PATH")

TEST_DATABASE_URL_VAR = "CODEEXPERT_TEST_DATABASE_URL"


@contextmanager
def disposable_database() -> Iterator[str]:
    """Create an empty database, yield its DSN, drop it however the test ends.

    The URL in `CODEEXPERT_TEST_DATABASE_URL` only has to reach a server where
    its user may `CREATE DATABASE`. Nothing is written to the database it names.
    """
    admin_dsn = os.environ.get(TEST_DATABASE_URL_VAR)
    if not admin_dsn:
        pytest.skip(f"{TEST_DATABASE_URL_VAR} is not set")

    import psycopg
    from psycopg import sql
    from psycopg.conninfo import make_conninfo

    name = f"codeexpert_test_{uuid.uuid4().hex[:12]}"
    with psycopg.connect(admin_dsn, autocommit=True) as admin:
        admin.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
    try:
        yield make_conninfo(admin_dsn, dbname=name)
    finally:
        with psycopg.connect(admin_dsn, autocommit=True) as admin:
            # FORCE: a pool a failing test never closed must not keep it alive.
            admin.execute(
                sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(name))
            )


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


class MemoryStore:
    """An `ArtifactStore` with no disk at all.

    Two workspaces sharing one instance stand in for two processes sharing a
    database: neither has a run directory, and `RunWorkspace.open()` still works.
    """

    def __init__(self) -> None:
        self._artefacts: dict[tuple[str, str], str] = {}
        self._runs: dict[str, bool] = {}

    def create_run(self, run_id: str) -> None:
        if run_id in self._runs:
            raise FileExistsError(run_id)
        self._runs[run_id] = False

    def run_exists(self, run_id: str) -> bool:
        return run_id in self._runs

    def put(self, run_id: str, name: str, content: str) -> None:
        self._artefacts[(run_id, name)] = content

    def get(self, run_id: str, name: str) -> str | None:
        return self._artefacts.get((run_id, name))

    def delete_run(self, run_id: str) -> None:
        self._runs.pop(run_id, None)
        for key in [key for key in self._artefacts if key[0] == run_id]:
            del self._artefacts[key]

    def mark_complete(self, run_id: str) -> None:
        self._runs[run_id] = True

    def is_complete(self, run_id: str) -> bool:
        return self._runs.get(run_id, False)


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


@pytest.fixture(scope="session")
def migrated_database() -> Iterator[str]:
    """One disposable database for the session, at the head revision."""
    from codeexpert.store.migrate import upgrade

    with disposable_database() as dsn:
        upgrade(dsn)
        yield dsn


@pytest.fixture
def empty_database() -> Iterator[str]:
    """A disposable database of its own, never migrated. For migration tests."""
    with disposable_database() as dsn:
        yield dsn


@pytest.fixture
def workspace(isolated_settings) -> RunWorkspace:
    return RunWorkspace.create(LocalFilesystemStore(isolated_settings.workspace_root))


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
