"""Teacher accounts and sessions: who is asking, and whether they may.

Nothing here imports FastAPI. The routes in `codeexpert.api.routes.session`
translate HTTP into these calls; the rules hold without a server.
"""

from codeexpert.accounts.limits import AttemptLimiter, AuthLimits
from codeexpert.accounts.passwords import burn_time, hash_password, verify_password
from codeexpert.accounts.policy import RegistrationError, validate_registration
from codeexpert.accounts.store import (
    AccountStore,
    LocalAccountStore,
    SessionGrant,
    Teacher,
    build_account_store,
    new_session_token,
    session_token_hash,
)

__all__ = [
    "AccountStore",
    "AttemptLimiter",
    "AuthLimits",
    "LocalAccountStore",
    "RegistrationError",
    "SessionGrant",
    "Teacher",
    "build_account_store",
    "burn_time",
    "hash_password",
    "new_session_token",
    "session_token_hash",
    "validate_registration",
    "verify_password",
]
