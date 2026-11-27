"""The account store contract, kept by both backends (docs/adr/0019).

The Postgres run needs a database and skips itself when
`CODEEXPERT_TEST_DATABASE_URL` is unset, like `test_store.py`. That database is
shared between runs, so every id and e-mail here is fresh.
"""

import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest

from codeexpert.accounts import LocalAccountStore, Teacher, session_token_hash
from codeexpert.accounts.store import AccountStore

pytestmark = pytest.mark.integration


@pytest.fixture(params=["local", "postgres"])
def store(request: pytest.FixtureRequest, tmp_path: Path) -> AccountStore:
    if request.param == "local":
        return LocalAccountStore(tmp_path / "accounts.json")
    url = os.environ.get("CODEEXPERT_TEST_DATABASE_URL")
    if not url:
        pytest.skip("CODEEXPERT_TEST_DATABASE_URL is not set")

    from codeexpert.accounts.postgres import PostgresAccountStore

    return PostgresAccountStore(url)


def _teacher() -> Teacher:
    key = uuid4().hex
    return Teacher(id=key, name="Ana", email=f"ana-{key[:12]}@example.edu", department="DC")


def test_an_email_has_one_account(store: AccountStore) -> None:
    ana = _teacher()
    assert store.create_teacher(ana, "hash")
    other = Teacher(id=uuid4().hex, name="Outra", email=ana.email)

    assert not store.create_teacher(other, "x")
    assert store.find_by_email(ana.email) == (ana, "hash")
    assert store.find_by_email(f"ninguem-{uuid4().hex[:12]}@example.edu") is None


def test_a_session_lasts_until_it_expires_or_closes(store: AccountStore) -> None:
    ana = _teacher()
    store.create_teacher(ana, "hash")
    now = datetime.now(UTC)
    token = session_token_hash(uuid4().hex)
    store.open_session(ana.id, token, now + timedelta(hours=1))

    assert store.teacher_for_session(token, now) == ana
    assert store.teacher_for_session(token, now + timedelta(hours=2)) is None
    store.close_session(token)
    assert store.teacher_for_session(token, now) is None


def test_an_unknown_token_finds_nobody(store: AccountStore) -> None:
    assert store.teacher_for_session(session_token_hash(uuid4().hex), datetime.now(UTC)) is None
