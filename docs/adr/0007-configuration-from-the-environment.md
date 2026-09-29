# ADR-0007 — Configuration from the environment

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

Configuration was a hand-parsed text file, `config/LLM_Config.txt`, tracked by
git:

```text
Fornecedor: OpenAI
Modelo: gpt-4o-mini
Path KEY: \Users\hugos\OneDrive\Documentos\OpenAiKey.txt
```

A committed file carrying one developer's absolute Windows path. Not a secret —
the key file itself was never in the repository — but every clone started broken,
and every developer had to edit a tracked file, which then showed up dirty in
`git status` forever. Six people would have six variants of that edit.

It also could not be supplied any other way. CI has no filesystem path to point
at, and neither does a container. The key was loaded at import time and stuffed
into `os.environ`, so a missing key was an exception during startup rather than a
condition the service could report.

## Decision

Settings come from environment variables prefixed `CODEEXPERT_`, read by a
`pydantic-settings` model in `src/codeexpert/settings.py`. A `.env` file is read
for local development and is git-ignored; `.env.example` is tracked and contains
only fake values. `config/LLM_Config.txt` is removed from tracking.

The API key is optional at startup and typed `SecretStr`. The server starts
without one: `/health` and the docs work, `/config` reports exactly what is
missing, and a generation request fails with 503 and a message naming the
variable. The key never appears in a log, a `repr` or a response — asserted by a
test.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Keep the text file, untrack it, ship an `.example` | Fixes the committed path and nothing else: still unusable in CI or a container, still hand-parsed |
| A secret manager | Right answer for the platform, disproportionate for a prototype six people run locally |
| A required key at startup | Makes the service unrunnable for anyone reading the API or the docs, and turns a missing key into a crash instead of a diagnosable state |

## Consequences

**Good**

- A clone runs after `make setup`, with no tracked file to edit.
- The same code is configured identically in a shell, in CI and in a container.
- Validation and defaults are declared once, in one model.
- A missing key is a reportable state rather than a stack trace.

**Bad, or costly**

- A migration step for everyone with a working copy: copy `.env.example` to
  `.env` and move the key into it.
- Environment variables are flat and typo-friendly. `extra="ignore"` means a
  misspelled variable is silently ignored — the reason `/config` echoes the
  effective values back.

## Revisit when

This is deployed somewhere shared, where a secret manager replaces `.env`.
