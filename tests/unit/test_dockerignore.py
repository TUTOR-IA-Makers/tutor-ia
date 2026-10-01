"""The image must never carry secrets or runtime artefacts.

`.dockerignore` is the only thing standing between a developer's `.env` and an
image layer, and a broken line there is invisible until someone inspects the
image. These tests keep it honest without needing Docker.
"""

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

# Never allowed in the build context: secrets and everything the app writes.
MUST_BE_IGNORED = [
    ".env",
    ".env.*",
    "var/",
    "cache/",
    "Questions/",
    "config/LLM_Config.txt",
    ".git",
]

# `pip install .` needs these: pyproject.toml reads README.md and LICENSE.
MUST_STAY_IN_CONTEXT = ["pyproject.toml", "README.md", "LICENSE", "src"]


def _patterns() -> set[str]:
    lines = (ROOT / ".dockerignore").read_text(encoding="utf-8").splitlines()
    return {line.strip() for line in lines if line.strip() and not line.startswith("#")}


@pytest.mark.parametrize("pattern", MUST_BE_IGNORED)
def test_secrets_and_artefacts_are_excluded(pattern: str) -> None:
    assert pattern in _patterns()


@pytest.mark.parametrize("name", MUST_STAY_IN_CONTEXT)
def test_files_the_package_build_needs_are_not_excluded(name: str) -> None:
    patterns = _patterns()
    assert name not in patterns
    assert f"{name}/" not in patterns


def test_dockerfile_does_not_bake_in_a_key() -> None:
    lines = (ROOT / "Dockerfile").read_text(encoding="utf-8").splitlines()
    # Comments may mention the variable; instructions (and their continuation
    # lines) must not set it, or the key would live in an image layer.
    code = "\n".join(line for line in lines if not line.strip().startswith("#"))
    assert "CODEEXPERT_LLM_API_KEY" not in code
