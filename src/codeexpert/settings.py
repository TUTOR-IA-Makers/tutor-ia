"""Configuration, read from the environment.

Replaces the hand-parsed `config/LLM_Config.txt` singleton: that file carried an
absolute path from one developer's machine into the repository, and could not be
supplied by CI or a container. See docs/adr/0007.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from codeexpert.errors import ConfigurationError


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CODEEXPERT_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── LLM provider ──────────────────────────────────────────────────────────
    # Optional so the server starts without a key: `GET /health` and the docs
    # still work, and `GET /config` reports precisely what is missing.
    llm_api_key: SecretStr | None = None
    llm_model: str = "gpt-4o-mini"
    llm_base_url: str = "https://api.openai.com/v1"
    llm_timeout_seconds: float = Field(default=60.0, gt=0)
    llm_max_retries: int = Field(default=3, ge=1, le=10)

    # ── Filesystem ────────────────────────────────────────────────────────────
    workspace_root: Path = Path("var/runs")
    questions_dir: Path = Path("var/questions")

    # ── Local execution limits ────────────────────────────────────────────────
    # Resource limits, not isolation. See docs/adr/0004.
    compile_timeout_seconds: float = Field(default=20.0, gt=0)
    run_timeout_seconds: float = Field(default=5.0, gt=0)
    run_max_output_bytes: int = Field(default=64 * 1024, gt=0)

    def require_api_key(self) -> str:
        """Return the API key, or explain how to set it."""
        if self.llm_api_key is None or not self.llm_api_key.get_secret_value().strip():
            raise ConfigurationError(
                "CODEEXPERT_LLM_API_KEY is not set. Copy .env.example to .env and "
                "fill it in, or export the variable in your shell."
            )
        return self.llm_api_key.get_secret_value()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Process-wide settings. Cached so the .env file is read once."""
    return Settings()


def reset_settings_cache() -> None:
    """Drop the cache so the next call re-reads the environment.

    Used by `GET /config` and by tests that patch environment variables.
    """
    get_settings.cache_clear()
