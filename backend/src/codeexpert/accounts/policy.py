"""The registration rules, repeated from `frontend/src/features/auth/schema.ts`.

The form checks all of this before sending, but anyone can call the API without
the form. Keep the two in step: a rule only the front enforces is not a rule.
"""

import re
from dataclasses import dataclass

EMAIL_MAX = 254
EMAIL_LOCAL_MAX = 64
PASSWORD_MIN = 10
PASSWORD_MAX = 128
NAME_MIN = 2
NAME_MAX = 100
INVITE_PATTERN = re.compile(r"^[A-Z0-9-]{6,32}$")

_LOCAL_PART = re.compile(r"^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$")
_DOMAIN_LABEL = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")
_TOP_LEVEL = re.compile(r"^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$")

COMMON_PASSWORDS = frozenset(
    {
        "0123456789",
        "1234567890",
        "12345678910",
        "1234554321",
        "1q2w3e4r5t",
        "abc1234567",
        "abcdefghij",
        "administrador",
        "codeexpert",
        "codeexpert1",
        "codeexpert123",
        "iloveyou123",
        "milani",
        "milani1234",
        "milani12345",
        "minhasenha",
        "minhasenha123",
        "password123",
        "password1234",
        "qwerty1234",
        "qwerty12345",
        "qwertyuiop",
        "senha12345",
        "senha123456",
        "senhasenha",
    }
)


class RegistrationError(ValueError):
    """The registration breaks a rule. The message is for logs, never for the client."""


@dataclass(frozen=True)
class Registration:
    name: str
    email: str
    password: str
    invite_code: str


def has_control_character(value: str) -> bool:
    return any(ord(char) < 0x20 or 0x7F <= ord(char) <= 0x9F for char in value)


def normalise_email(value: str) -> str:
    return value.strip().lower()


def is_valid_email(value: str) -> bool:
    if len(value) > EMAIL_MAX or re.search(r"\s", value) or has_control_character(value):
        return False
    parts = value.split("@")
    if len(parts) != 2:
        return False
    local, domain = parts
    if not local or len(local) > EMAIL_LOCAL_MAX or not _LOCAL_PART.match(local):
        return False
    labels = domain.split(".")
    if len(labels) < 2:
        return False
    return all(_DOMAIN_LABEL.match(label) for label in labels) and bool(
        _TOP_LEVEL.match(labels[-1])
    )


def is_common_password(password: str) -> bool:
    return password.lower() in COMMON_PASSWORDS or re.fullmatch(r"(.)\1+", password) is not None


def validate_registration(
    *, name: str, email: str, password: str, invite_code: str
) -> Registration:
    """The registration with its fields normalised, or `RegistrationError`."""
    name = name.strip()
    email = normalise_email(email)
    invite_code = invite_code.strip().upper()
    if not NAME_MIN <= len(name) <= NAME_MAX or has_control_character(name):
        raise RegistrationError("name")
    if not is_valid_email(email):
        raise RegistrationError("email")
    if not PASSWORD_MIN <= len(password) <= PASSWORD_MAX or is_common_password(password):
        raise RegistrationError("password")
    local = email.split("@")[0]
    if password.lower() in {email, local}:
        raise RegistrationError("password equals e-mail")
    # TODO(convites): only the format is checked. Whether the code exists, is
    # unused and belongs to this e-mail needs the invite table, not built yet.
    if not INVITE_PATTERN.match(invite_code):
        raise RegistrationError("invite format")
    return Registration(name=name, email=email, password=password, invite_code=invite_code)
