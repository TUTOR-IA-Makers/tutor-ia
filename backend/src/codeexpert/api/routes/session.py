"""Sign in, sign out, who am I, and create an account.

The contract is docs/architecture/frontend-integracao.md §5. Every refusal is
the same for every cause: a different answer for "no such e-mail" and "wrong
password" would let a stranger list who has an account. See docs/adr/0019.
"""

import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Request, Response, status

from codeexpert.accounts import (
    RegistrationError,
    SessionGrant,
    Teacher,
    burn_time,
    hash_password,
    new_session_token,
    session_token_hash,
    validate_registration,
    verify_password,
)
from codeexpert.accounts.policy import normalise_email
from codeexpert.accounts.store import AccountStore, new_teacher_id
from codeexpert.api.deps import (
    SESSION_COOKIE,
    AccountStoreDep,
    AuthLimitsDep,
    CurrentTeacher,
    SettingsDep,
    require_web_client,
)
from codeexpert.api.schemas import Credentials, Registration, TeacherView
from codeexpert.errors import AccountRefusedError, NotSignedInError, TooManyRequestsError
from codeexpert.settings import Settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["session"], dependencies=[Depends(require_web_client)])

LOGIN_REFUSED = "E-mail or password is incorrect."
SIGNUP_REFUSED = "The account could not be created with these details."


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check(retry_after: int | None) -> None:
    if retry_after is not None:
        raise TooManyRequestsError("Too many attempts. Wait and try again.", retry_after)


def _open_session(
    response: Response, teacher: Teacher, accounts: AccountStore, settings: Settings
) -> None:
    grant = SessionGrant(
        token=new_session_token(),
        expires_at=datetime.now(UTC) + timedelta(hours=settings.session_ttl_hours),
    )
    accounts.open_session(teacher.id, session_token_hash(grant.token), grant.expires_at)
    response.set_cookie(
        SESSION_COOKIE,
        grant.token,
        max_age=settings.session_ttl_hours * 3600,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/session", status_code=status.HTTP_204_NO_CONTENT)
def sign_in(
    credentials: Credentials,
    request: Request,
    response: Response,
    accounts: AccountStoreDep,
    limits: AuthLimitsDep,
    settings: SettingsDep,
) -> None:
    email = normalise_email(credentials.email)
    ip = _client_ip(request)
    _check(limits.login_by_email.retry_after(email))
    _check(limits.login_by_ip.retry_after(ip))

    found = accounts.find_by_email(email)
    if found is None:
        burn_time(credentials.password)
    elif verify_password(credentials.password, found[1]):
        limits.login_by_email.clear(email)
        _open_session(response, found[0], accounts, settings)
        return
    limits.login_by_email.record(email)
    limits.login_by_ip.record(ip)
    raise NotSignedInError(LOGIN_REFUSED)


@router.get("/session", response_model=TeacherView)
def current_session(teacher: CurrentTeacher) -> TeacherView:
    return TeacherView(name=teacher.name, department=teacher.department)


@router.post("/session/logout", status_code=status.HTTP_204_NO_CONTENT)
def sign_out(request: Request, response: Response, accounts: AccountStoreDep) -> None:
    """Always 204: signing out of a session that already ended is not an error."""
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        accounts.close_session(session_token_hash(token))
    response.delete_cookie(SESSION_COOKIE, path="/")


@router.post("/accounts", status_code=status.HTTP_201_CREATED)
def create_account(
    registration: Registration,
    request: Request,
    response: Response,
    accounts: AccountStoreDep,
    limits: AuthLimitsDep,
    settings: SettingsDep,
) -> None:
    ip = _client_ip(request)
    _check(limits.signup_by_ip.retry_after(ip))
    limits.signup_by_ip.record(ip)
    try:
        valid = validate_registration(
            name=registration.name,
            email=registration.email,
            password=registration.password,
            invite_code=registration.invite_code,
        )
    except RegistrationError as error:
        logger.info("Account refused: %s", error)
        raise AccountRefusedError(SIGNUP_REFUSED) from None

    # Hashed before the e-mail is checked, so a taken e-mail answers as slowly
    # as a new one.
    password_hash = hash_password(valid.password)
    teacher = Teacher(id=new_teacher_id(), name=valid.name, email=valid.email)
    if not accounts.create_teacher(teacher, password_hash):
        logger.info("Account refused: e-mail already registered")
        raise AccountRefusedError(SIGNUP_REFUSED)
    _open_session(response, teacher, accounts, settings)
