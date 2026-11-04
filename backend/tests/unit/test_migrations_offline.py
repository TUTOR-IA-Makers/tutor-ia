"""What can be said about the migrations without a database. See docs/adr/0013."""

import pytest
from alembic.script import ScriptDirectory

from codeexpert.__main__ import main
from codeexpert.settings import reset_settings_cache
from codeexpert.store.migrate import alembic_config, head_revision


def test_the_revisions_form_a_single_chain() -> None:
    """Two branches merged with a revision each give two heads, and `upgrade head` fails."""
    script = ScriptDirectory.from_config(alembic_config())

    assert len(script.get_heads()) == 1
    assert script.get_current_head() == head_revision()
    assert len(list(script.walk_revisions())) >= 1


def test_migrate_without_a_database_url_says_what_to_set(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    # Empty rather than unset, so a URL in a developer's .env cannot answer instead.
    monkeypatch.setenv("CODEEXPERT_DATABASE_URL", "")
    reset_settings_cache()

    assert main(["migrate"]) == 1
    assert "CODEEXPERT_DATABASE_URL is not set" in caplog.text


def test_an_unknown_command_is_rejected(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["migrat"]) == 2
    assert "usage: codeexpert" in capsys.readouterr().err
