# 13 — [S1][G0-3] Segredos fora do repositório

- **Branch** `feat/13-segredos-em-arquivo`
- **Issue** #13
- **Started** 2026-10-28
- **Driver** martinnho

## Goal

`Settings` can take the LLM key from a file in `/run/secrets` instead of an
environment variable, so the VPS of ADR-0011 never has to put the key in the
container's environment (`docker inspect`, `/proc/1/environ`). A test fails if
the key shows up in a log line or in an error response, and the one path where
it could — a provider echoing the key in its error body — is closed.

## Out of scope

- The Compose file, the VPS, and the files on it. Those are G0-9 (#25), which is
  not merged; this branch is stacked on its docs commit (`c2b1f2b`). The first
  acceptance criterion and the VPS demonstration can only be completed once the
  VPS exists — they stay open on the issue.
- A database password field. There is no database until G1-1 (#15); the
  mechanism here covers any future `Settings` field without new code.
- Changing the gate's secret patterns.

## Constraints

- AGENTS.md rule 5: the docs must not claim the VPS reads the file today.
- `.env` locally must keep working exactly as now.
- No new dependency: pydantic-settings already has `secrets_dir`.

## Plan

- [x] `Settings` reads `/run/secrets/codeexpert_<field>` when the directory exists
- [x] Redact the key from provider error text before it reaches the log or `detail`
- [x] Tests: file is read, env and `.env` win over it, key absent from logs and error responses
- [x] Docs: configuration reference and deploy guide say what is built and what is planned

## Decisions taken along the way

- **`secrets_dir` from pydantic-settings, not a `*_FILE` variable.** Built in,
  no code per field, and its precedence (init > env > `.env` > secrets file >
  default) is exactly "the file when the variable does not exist".
- **Only enabled when `/run/secrets` exists.** pydantic-settings warns on every
  `Settings()` for a missing directory, and laptops and CI have none.
- **Redact before truncating.** The provider body is cut to 300 characters; a
  cut through the key would leave a prefix that `str.replace` cannot find.

## Verification

- `make check` (2026-10-28): every step passes except the front-end
  `production dependency audit` (zod < 4.6.6, fast-uri). That step fails the
  same way on the base commit with this diff stashed. It is #26 and is not
  touched here.
- `tests/integration/test_secret_leaks.py` with the `_redact` calls removed
  from `llm/client.py`: all three generation cases fail, the key showing in
  `detail` and in the log. With them, they pass.
- Not done, needs the VPS from #25: Compose `secrets` mount, file permissions,
  `docker inspect` / `/proc/1/environ` demonstration, a real generation.
