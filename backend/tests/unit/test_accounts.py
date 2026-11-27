"""Passwords, registration rules, attempt windows and the account store."""

from datetime import UTC, datetime, timedelta

import pytest

from codeexpert.accounts import (
    AttemptLimiter,
    LocalAccountStore,
    RegistrationError,
    Teacher,
    hash_password,
    session_token_hash,
    validate_registration,
    verify_password,
)

VALID = {
    "name": "  Ana Lima ",
    "email": " Ana@Example.EDU ",
    "password": "uma senha longa",
    "invite_code": " abc-123 ",
}


class TestPasswords:
    def test_the_right_password_verifies(self) -> None:
        assert verify_password("uma senha longa", hash_password("uma senha longa"))

    def test_a_wrong_password_does_not(self) -> None:
        assert not verify_password("outra senha", hash_password("uma senha longa"))

    def test_the_same_password_hashes_differently_each_time(self) -> None:
        assert hash_password("uma senha longa") != hash_password("uma senha longa")

    def test_the_hash_carries_its_cost_and_never_the_password(self) -> None:
        stored = hash_password("uma senha longa")
        assert stored.startswith("scrypt$")
        assert "uma senha longa" not in stored

    @pytest.mark.parametrize("stored", ["", "bcrypt$x", "scrypt$1$2", "scrypt$a$b$c$d$e"])
    def test_a_malformed_hash_verifies_nothing(self, stored: str) -> None:
        assert not verify_password("uma senha longa", stored)


class TestRegistration:
    def test_fields_are_normalised(self) -> None:
        valid = validate_registration(**VALID)
        assert (valid.name, valid.email, valid.invite_code) == (
            "Ana Lima",
            "ana@example.edu",
            "ABC-123",
        )

    @pytest.mark.parametrize(
        ("field", "value"),
        [
            ("name", "A"),
            ("name", "Ana\x00"),
            ("email", "sem-arroba"),
            ("email", "ana@localhost"),
            ("password", "curta"),
            ("password", "x" * 129),
            ("password", "senha12345"),
            ("password", "aaaaaaaaaaaa"),
            ("password", "Ana@example.edu"),
            ("invite_code", "abc"),
            ("invite_code", "com espaço"),
        ],
    )
    def test_each_rule_is_enforced(self, field: str, value: str) -> None:
        with pytest.raises(RegistrationError):
            validate_registration(**{**VALID, field: value})


class TestAttemptLimiter:
    def test_blocks_after_the_limit_and_frees_when_the_window_passes(self) -> None:
        now = [0.0]
        limiter = AttemptLimiter(max_failures=2, window_seconds=60, clock=lambda: now[0])
        limiter.record("ana")
        assert limiter.retry_after("ana") is None
        limiter.record("ana")
        assert limiter.retry_after("ana") == 60
        now[0] = 45
        assert limiter.retry_after("ana") == 15
        assert limiter.retry_after("outra") is None
        now[0] = 60
        assert limiter.retry_after("ana") is None

    def test_clear_forgets_the_failures(self) -> None:
        limiter = AttemptLimiter(max_failures=1, window_seconds=60)
        limiter.record("ana")
        limiter.clear("ana")
        assert limiter.retry_after("ana") is None


class TestLocalAccountStore:
    @pytest.fixture
    def store(self, tmp_path) -> LocalAccountStore:
        return LocalAccountStore(tmp_path / "accounts.json")

    def test_an_email_has_one_account(self, store) -> None:
        ana = Teacher(id="1", name="Ana", email="ana@example.edu")
        assert store.create_teacher(ana, "hash")
        assert not store.create_teacher(Teacher(id="2", name="Outra", email=ana.email), "x")
        assert store.find_by_email(ana.email) == (ana, "hash")
        assert store.find_by_email("ninguem@example.edu") is None

    def test_a_session_lasts_until_it_expires_or_closes(self, store) -> None:
        ana = Teacher(id="1", name="Ana", email="ana@example.edu")
        store.create_teacher(ana, "hash")
        now = datetime.now(UTC)
        token = session_token_hash("token")
        store.open_session(ana.id, token, now + timedelta(hours=1))

        assert store.teacher_for_session(token, now) == ana
        assert store.teacher_for_session(token, now + timedelta(hours=2)) is None
        store.close_session(token)
        assert store.teacher_for_session(token, now) is None

    def test_only_the_token_hash_is_written(self, store, tmp_path) -> None:
        store.create_teacher(Teacher(id="1", name="Ana", email="ana@example.edu"), "hash")
        store.open_session("1", session_token_hash("segredo-do-cookie"), datetime.now(UTC))
        assert "segredo-do-cookie" not in (tmp_path / "accounts.json").read_text()
