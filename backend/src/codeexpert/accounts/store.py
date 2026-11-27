"""Where teachers and their sessions are kept.

The session token goes to the browser in a cookie and is never stored: the
store keeps its SHA-256, so a copy of the database (a backup, a leaked dump)
opens no session. SHA-256 and not scrypt, because the token is 256 random bits
and no one can guess it; the slow hash protects passwords, which people choose.
"""

import hashlib
import json
import secrets
import threading
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Protocol

from codeexpert.errors import ConfigurationError
from codeexpert.settings import Settings

_TOKEN_BYTES = 32


@dataclass(frozen=True)
class Teacher:
    id: str
    name: str
    email: str
    department: str = ""


@dataclass(frozen=True)
class SessionGrant:
    """What the cookie carries, and until when. Only its hash is stored."""

    token: str
    expires_at: datetime


def new_session_token() -> str:
    return secrets.token_urlsafe(_TOKEN_BYTES)


def session_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_teacher_id() -> str:
    return uuid.uuid4().hex


class AccountStore(Protocol):
    def create_teacher(self, teacher: Teacher, password_hash: str) -> bool:
        """Store a new teacher. `False` when the e-mail already has an account."""
        ...

    def find_by_email(self, email: str) -> tuple[Teacher, str] | None:
        """The teacher and their password hash, or `None`."""
        ...

    def open_session(self, teacher_id: str, token_hash: str, expires_at: datetime) -> None: ...

    def teacher_for_session(self, token_hash: str, now: datetime) -> Teacher | None:
        """The session's teacher while it has not expired, else `None`."""
        ...

    def close_session(self, token_hash: str) -> None: ...


class LocalAccountStore:
    """One JSON file, for a laptop and the tests. Not for more than one process.

    Every change rewrites the file through a temporary one and `os.replace`, so
    a crash mid-write leaves the previous file and not half of one.
    """

    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = threading.Lock()

    def _load(self) -> dict:
        if not self._path.exists():
            return {"teachers": {}, "sessions": {}}
        return json.loads(self._path.read_text(encoding="utf-8"))

    def _save(self, data: dict) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._path.with_suffix(".tmp")
        temporary.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        temporary.replace(self._path)

    def create_teacher(self, teacher: Teacher, password_hash: str) -> bool:
        with self._lock:
            data = self._load()
            if any(row["email"] == teacher.email for row in data["teachers"].values()):
                return False
            data["teachers"][teacher.id] = {**asdict(teacher), "password_hash": password_hash}
            self._save(data)
            return True

    def find_by_email(self, email: str) -> tuple[Teacher, str] | None:
        with self._lock:
            data = self._load()
        for row in data["teachers"].values():
            if row["email"] == email:
                fields = {key: value for key, value in row.items() if key != "password_hash"}
                return Teacher(**fields), row["password_hash"]
        return None

    def open_session(self, teacher_id: str, token_hash: str, expires_at: datetime) -> None:
        with self._lock:
            data = self._load()
            data["sessions"][token_hash] = {
                "teacher_id": teacher_id,
                "expires_at": expires_at.isoformat(),
            }
            self._save(data)

    def teacher_for_session(self, token_hash: str, now: datetime) -> Teacher | None:
        with self._lock:
            data = self._load()
        session = data["sessions"].get(token_hash)
        if session is None or datetime.fromisoformat(session["expires_at"]) <= now:
            return None
        row = data["teachers"].get(session["teacher_id"])
        if row is None:
            return None
        return Teacher(**{key: value for key, value in row.items() if key != "password_hash"})

    def close_session(self, token_hash: str) -> None:
        with self._lock:
            data = self._load()
            if data["sessions"].pop(token_hash, None) is not None:
                self._save(data)


_postgres_stores: dict[str, AccountStore] = {}


def build_account_store(settings: Settings) -> AccountStore:
    """The same backend as the runs: `store_backend` decides both."""
    if settings.store_backend == "local":
        # Beside the runs directory, so redirecting `workspace_root` (as every
        # test does) also redirects the accounts.
        return LocalAccountStore(settings.workspace_root.parent / "accounts.json")
    if settings.database_url is None or not settings.database_url.get_secret_value().strip():
        raise ConfigurationError(
            "CODEEXPERT_STORE_BACKEND=postgres needs CODEEXPERT_DATABASE_URL, or the "
            "secret file /run/secrets/codeexpert_database_url."
        )
    dsn = settings.database_url.get_secret_value()
    if dsn not in _postgres_stores:
        from codeexpert.accounts.postgres import PostgresAccountStore

        _postgres_stores[dsn] = PostgresAccountStore(dsn)
    return _postgres_stores[dsn]
