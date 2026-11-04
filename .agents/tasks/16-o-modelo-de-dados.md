# 16 — O modelo de dados

- **Branch** `feat/16-o-modelo-de-dados`
- **Issue** #16
- **Started** 2026-11-04
- **Driver** Codex

## Goal

Persist structured questions, test cases and generation metadata in Postgres,
linked by run_id, with nullable usage accounting fields.

## Out of scope

Question versioning, approval roles, cost collection, library endpoints and prompt changes.

## Constraints

Keep ArtifactStore compatibility and existing artifacts. Reuse Difficulty and
ContentAxis. No new dependencies. Expected outputs come from execution.

## Plan

- [x] Add an additive, idempotent schema and transactional completion snapshot.
- [x] Add typed reading and tests for persistence, replacement and rollback.
- [x] Document schema and a proposed ADR (authorized by the user).
- [x] Run the official gate.

## Decisions taken along the way

Structured data records the last completed generation. Artifacts continue to
hold in-progress work. Axis is nullable: legacy requests have no classification.

## Verification

`make check` passed in an isolated Linux container (Python 3.13, gcc, Postgres
16): all 113 backend tests passed, including the seven new Postgres tests;
formatting, lint, artifact/secret guards and strict documentation build passed.
The container had no frontend dependencies, so that gate step was explicitly
skipped there. The full frontend gate passed on Windows (357 tests, coverage,
formatting, lint, types, contrast, build, bundle checks and dependency audit).

The Windows backend gate exposed the existing Unix-only timeout implementation
(`os.killpg`); verification was therefore completed on Linux as the onboarding
requires. No execution code or frontend content was changed. Windows checkout
line endings were normalized to LF for Prettier, with no frontend Git diff.

The disposable database was used to verify reopen/read, nullable usage fields,
case replacement, rollback, metadata identity, cascade deletion and upgrading
the previous schema without losing artifacts. No model provider was called.

Implementation is ready for human review. ADR-0013 remains Proposed. Keep this
task file until preparing the PR that closes #16, then delete it in that PR.
