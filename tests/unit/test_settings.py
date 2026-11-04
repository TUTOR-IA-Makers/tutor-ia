"""Configuration comes from the environment, and says so when it does not."""

from pathlib import Path

import pytest

from codeexpert.errors import ConfigurationError
from codeexpert.settings import Settings, get_settings, reset_settings_cache


def test_env_vars_win(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CODEEXPERT_LLM_MODEL", "some-other-model")
    reset_settings_cache()
    assert get_settings().llm_model == "some-other-model"


def test_missing_key_explains_the_fix() -> None:
    settings = Settings(llm_api_key=None)
    with pytest.raises(ConfigurationError) as exc:
        settings.require_api_key()
    assert ".env" in str(exc.value)


def test_key_is_not_exposed_by_repr(isolated_settings) -> None:
    assert "sk-test-not-a-real-key" not in repr(isolated_settings)


class TestSecretFiles:
    """On the VPS the key arrives as /run/secrets/codeexpert_llm_api_key (ADR-0011)."""

    @pytest.fixture
    def secrets_dir(self, tmp_path: Path) -> Path:
        directory = tmp_path / "secrets"
        directory.mkdir()
        # `echo key > file` leaves a newline; it must not become part of the key.
        (directory / "codeexpert_llm_api_key").write_text("sk-from-file\n", encoding="utf-8")
        return directory

    def test_key_is_read_from_the_file_when_no_variable_sets_it(
        self, secrets_dir: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("CODEEXPERT_LLM_API_KEY")
        settings = Settings(_env_file=None, _secrets_dir=secrets_dir)
        assert settings.require_api_key() == "sk-from-file"

    def test_environment_wins_over_the_file(self, secrets_dir: Path) -> None:
        settings = Settings(_env_file=None, _secrets_dir=secrets_dir)
        assert settings.require_api_key() == "sk-test-not-a-real-key"

    def test_dotenv_wins_over_the_file(
        self, secrets_dir: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("CODEEXPERT_LLM_API_KEY")
        dotenv = tmp_path / ".env"
        dotenv.write_text("CODEEXPERT_LLM_API_KEY=sk-from-dotenv\n", encoding="utf-8")
        settings = Settings(_env_file=dotenv, _secrets_dir=secrets_dir)
        assert settings.require_api_key() == "sk-from-dotenv"

    def test_key_from_the_file_is_not_exposed_by_repr(
        self, secrets_dir: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("CODEEXPERT_LLM_API_KEY")
        settings = Settings(_env_file=None, _secrets_dir=secrets_dir)
        assert "sk-from-file" not in repr(settings)


@pytest.mark.parametrize("raw", ["", "   "])
def test_blank_commit_sha_means_not_deployed(raw: str) -> None:
    assert Settings(commit_sha=raw).commit_sha is None
