# ADR-0019 — Teacher accounts with scrypt, opaque cookie sessions and per-teacher questions

- **Status** Proposed
- **Date** 2026-11-27
- **Deciders** the team (draft written by an agent; a person accepts)

## Context

ADR-0013 chose a cookie session for the resource API and left the accounts
themselves open. The login and sign-up screens existed only against the mock,
and every `/api/v1` route answered anyone. Three things made that untenable:

- **Generations cost money.** Each one is several paid model calls. An open
  `POST /api/v1/questions` lets anyone spend the project's credit.
- **The library mixed everyone's questions.** With more than one teacher, a
  teacher saw, approved and exported questions they did not write.
- **The approver was typed by the client.** `approved_by` came from the request
  body, so the approval record (ADR-0016) recorded whatever the caller claimed.

Constraints that shaped the choice:

- **No new dependency without review** (`AGENTS.md` §7). Argon2id and bcrypt need
  a package; the standard library has `hashlib.scrypt`.
- **Two stores** (ADR-0012): whatever holds accounts must also work on the local
  filesystem the offline suite runs on.
- **Questions from before this change have no owner.** Hiding them would make a
  bank that already exists disappear.
- **Invites are not designed yet.** Who issues them, whether they expire and how
  many uses each has is still open.
- **Behind Caddy, the app may see one client IP.** `uvicorn` trusts
  `X-Forwarded-For` only from `127.0.0.1` by default; whether that matches the
  deployment (ADR-0011) has not been checked.

## Decision

- **Passwords** are hashed with `hashlib.scrypt` (N=2^17, r=8, p=1, 16-byte salt,
  32-byte key), stored as `scrypt$N$r$p$salt$key` so the cost can rise later
  without breaking older hashes. A login for an unknown e-mail still runs one
  derivation, so timing does not reveal which accounts exist.
- **Sessions** are opaque random tokens (`secrets.token_urlsafe(32)`) in an
  `HttpOnly; Secure; SameSite=Lax; Path=/` cookie. The store keeps only their
  SHA-256, so a leaked database does not hand out live sessions. They last
  `CODEEXPERT_SESSION_TTL_HOURS` (default 168).
- **Accounts** live behind an `AccountStore` protocol with a JSON-file
  implementation next to the local runs and a Postgres one (`teachers`,
  `sessions`), chosen by the same `store_backend` as the artefacts.
- **Every state-changing request** under `/api/v1` must carry
  `X-Requested-With: codeexpert-web`; without it the answer is `403`.
- **Every question route** requires a session (`401` otherwise). A new question
  records its creator as `owner` in `draft.json`, taken from the session and never
  from the body. A teacher sees, opens and changes only their own questions and
  those with no owner. Another teacher's question is a `404`, like one that does
  not exist.
- **The approver** is the signed-in teacher's name; a name in the body is ignored.
- **Limits**, all answering `429` with `Retry-After`: 10 failed logins per e-mail
  and 100 per IP in 15 minutes, 20 sign-ups per IP per hour (in memory, per
  process), and `CODEEXPERT_DAILY_GENERATION_LIMIT` generations (default 20) per
  teacher in any rolling 24 hours, counted from the runs themselves.
- **Every refusal** of a sign-up or login is the same message; the reason goes to
  the log only.
- **Invites** are validated for format only (`^[A-Z0-9-]{6,32}$`). Any well-formed
  code is accepted until invites are designed. This is marked `TODO(convites)` in
  `accounts/policy.py`.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Argon2id (`argon2-cffi`) | The OWASP first choice, but a new compiled dependency needs a supply-chain review; scrypt is the listed alternative and ships with Python |
| bcrypt | Also a dependency, and truncates passwords at 72 bytes while the policy allows 128 characters |
| Signed stateless tokens (JWT) in the cookie | Logout cannot revoke them without a deny list, which is a session table again |
| Hide questions with no owner | Makes the existing bank vanish on deploy; nobody could approve or export it |
| Assign unowned questions to the first teacher who opens them | Silent and racy; a person can do it deliberately later |
| Rate limiting in Caddy | Cannot tell a failed login from a successful one, nor count generations per teacher |
| A calendar-day generation quota | Midnight UTC is 21h in Brasília; a rolling window resets when a teacher expects |

## Consequences

**Good**

- Generation spend is bounded per teacher, and only signed-in teachers can spend.
- The approval record names a real, authenticated person.
- No new dependency; the offline suite needs no database.

**Bad, or costly**

- **Anyone with a well-formed invite code can create an account** until invites
  are designed. The daily generation limit is the only cost bound meanwhile.
- **Attempt limits live in memory**: a restart forgets them, and two workers would
  keep two counts. Fine for the single-process VPS deployment (ADR-0011).
- **The per-IP limits may see only the proxy's address** if the forwarded header
  is not trusted, so every teacher would share one bucket. The per-IP numbers are
  generous for that reason; this must be checked against the deployment.
- **The legacy RPC routes at the root** (`/gen_statement`, `/questions/{id}/approve`
  and the rest) are still unauthenticated. They predate `/api/v1` and should be
  closed or removed in their own change.
- **Unowned questions are shared** by every teacher until someone assigns them.
- **scrypt at N=2^17 uses 128 MiB per login**; concurrent logins add up on a small
  VPS.

## Revisit when

- Invites are designed: replace the format check with a lookup and single use.
- The API runs on more than one process: move attempt limits to the database.
- The forwarded-IP question is answered for the deployment.
- A supply-chain review clears `argon2-cffi`: rehash on next login.
