"""Password hashing with scrypt from the standard library.

scrypt is memory-hard like Argon2id and ships with Python, so no new dependency
enters the supply chain. The cost is OWASP's scrypt recommendation (N=2^17,
r=8, p=1). The stored string carries its own parameters, so raising the cost
later never locks anyone out: old hashes still verify with the cost they were
made with. See docs/adr/0019.
"""

import base64
import hashlib
import hmac
import secrets

SCRYPT_N = 2**17
SCRYPT_R = 8
SCRYPT_P = 1
_KEY_LENGTH = 32
_SALT_BYTES = 16
_PREFIX = "scrypt"


def _derive(password: str, salt: bytes, n: int, r: int, p: int) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        # 128 * r * n bytes are needed; the default limit (32 MiB) is below that.
        maxmem=256 * r * n,
        dklen=_KEY_LENGTH,
    )


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    key = _derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P)
    return f"{_PREFIX}${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64(salt)}${_b64(key)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        prefix, n, r, p, salt, key = stored.split("$")
        if prefix != _PREFIX:
            return False
        derived = _derive(password, _unb64(salt), int(n), int(r), int(p))
    except ValueError:
        return False
    return hmac.compare_digest(derived, _unb64(key))


def burn_time(password: str) -> None:
    """Spend what a verification costs when there is no account to verify.

    Without it, "no such e-mail" answers faster than "wrong password", and the
    response time tells a stranger which e-mails have accounts.
    """
    _derive(password, b"\0" * _SALT_BYTES, SCRYPT_N, SCRYPT_R, SCRYPT_P)
