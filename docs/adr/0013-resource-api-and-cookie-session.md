# ADR-0013 — Serve the web client from a resource API under /api/v1 with a cookie session

- **Status** Proposed
- **Date** 2026-11-03
- **Deciders** the team (draft written by an agent; a person accepts)

## Context

The frontend in `frontend/` was built against a service contract
(`frontend/src/services/contracts.ts`) and runs on in-memory mock data. Its
HTTP adapter already calls a resource API under `/api/v1`: `questions`,
`questions/{id}/generation`, `approve`, `reject`, `regenerate`, `statement`,
`exports/moodle`, `session`, `session/logout` and `accounts`.

The backend on `main` exposes something else: one RPC-style route per pipeline
step at the root (`/gen_statement`, `/gen_code`, `/gen_inputs`,
`/gen_testcases`, `/create_question`, `/export_moodle_xml_question`), plus
`/health` and `/config`. It has no database, no stored questions and no
authentication. Generation is synchronous inside the request.

The 30/11 plan already commits the backend to things the RPC shape cannot
carry: generation as a resumable job with state in the database (G0-8), a
library that can be listed and filtered (G1-5), an explicit question
lifecycle (G3-1), a pure exporter (G1-8), invite-only access (G8-1) and
per-user quotas (G8-2). The sign-in and sign-up screens now exist in the
frontend (`/entrar`, `/criar-conta`) and only work in mock mode.

Two questions are open at the same time and constrain each other: what shape
the API takes, and how the browser proves who it is.

## Decision

1. The backend adds a resource API under `/api/v1` that matches the frontend
   contract. The server orchestrates the five pipeline steps:
   `POST /api/v1/questions` answers `202 {id}` and the generation runs as a job;
   the client polls `GET /api/v1/questions/{id}/generation`.
2. The RPC routes stay while the Swagger UI and pipeline tests use them, and are
   removed once the resource API covers the same case.
3. Authentication is e-mail and password, with an invite code required at
   sign-up. The session is a server-side session referenced by a cookie set
   with `HttpOnly; Secure; SameSite=Lax; Path=/`. No token is ever readable by
   JavaScript.
4. Every state-changing request must carry `X-Requested-With: codeexpert-web`
   (the frontend HTTP client already sends it); the backend rejects it
   otherwise.
5. Authentication errors are uniform: a wrong password and an unknown e-mail
   produce the same `401`; every sign-up refusal produces the same response;
   rate limits answer `429` with `Retry-After`.
6. The backend is the authority for every validation rule. The frontend
   validates the same rules (`frontend/src/features/auth/schema.ts`) only so the
   user gets feedback before a request is sent.
7. Frontend and API are served from the same origin behind the VPS proxy
   (ADR-0011). CORS stays closed.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Browser calls the four RPC steps in sequence | Moves orchestration into a browser tab: closing it loses the generation and the model cost already paid, and the client has to know the step order. Contradicts G0-8 |
| Keep RPC routes and adapt the frontend to them | The RPC routes have no notion of a stored question, so the library, lifecycle and export screens would have nothing to call |
| Bearer token (JWT) kept in memory or `localStorage` | Any XSS can read it; `localStorage` survives the tab. The frontend lint already forbids `localStorage` and `document.cookie` for this reason. Refresh-token handling adds code with no benefit on a single-origin deployment |
| OAuth only (Google, GitHub) | Needs a registered app per provider, new origins in the CSP, and still needs a way to tie a person to an invite. The buttons in the UI are mocks until a separate decision |
| Magic link by e-mail | Requires outbound e-mail from the VPS, which the team does not operate yet |
| Separate origin for the API with CORS | Cookies across origins need `SameSite=None`, which reopens CSRF and complicates local development. ADR-0011 already puts both behind one proxy |

## Consequences

**Good**

- Switching the frontend from mock to the real API is a configuration change
  (`VITE_PUBLIC_API_MODE=http`); no screen changes.
- Server-side sessions can be revoked one by one, which a self-contained token
  cannot without a deny list.
- One origin means no CORS configuration and a short CSP.
- Uniform errors keep the invite list and the account list from being
  enumerated through the login form.

**Bad, or costly**

- The backend needs a session store and an accounts table before any screen
  works for real; F1 in `docs/architecture/frontend-integracao.md` is blocked on
  G0-4 (the database).
- Two API styles coexist for a while, and someone has to remove the RPC routes.
- Password storage becomes our problem: hashing (Argon2id or bcrypt), reset
  flow, and the LGPD duties in G8-4.
- Polling `/generation` costs requests that a server push would not; acceptable
  for one teacher watching one generation.
- Every validation rule exists twice (frontend and backend) and can drift. A
  contract test is planned, not built.

## Revisit when

- A second client (a Moodle plugin, a CLI) needs to call the API without a
  browser, which makes a token-based scheme worth its cost.
- The frontend and API have to live on different origins.
- Sign-in through an institutional identity provider (for example the
  university's SSO) becomes available to the team.
