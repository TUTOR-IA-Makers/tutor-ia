"""Configuration comes from the environment, and says so when it does not."""

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
