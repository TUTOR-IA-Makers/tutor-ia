# 40 — [S2][G3-2] Aprovar uma questão

- **Branch** `feat/40-aprovar-questao`
- **Issue** #40
- **Started** 2026-11-17
- **Driver** Hugo Rosa

## Goal

Approving a question records a responsible person. After this, `POST
/questions/{id}/approve` (and the same action under `/api/v1`, which the review
screen calls) takes the approver's name. It moves `GERADA` to `APROVADA`, sets
`reviewed: true`, and stores `approved_by` and `approved_at` on both backends.
Approving an already approved question returns the original record unchanged
instead of a `409`. Approving a `FALHOU_VERIFICACAO` question is still a `409`.

## Out of scope

- Authentication or sessions. The approver's name comes from the request body
  until G8-1 provides a session.
- Restricting export to approved questions (G3-4, S4).
- Editing a reviewed question or un-approving one (G3-3).
- Rejection reason (G3-5). `reject` keeps its current contract.
- Frontend changes. G4-5 (Dupla B) wires the button to the documented contract.
- The `X-Requested-With` check from ADR-0013. It is not built for any route yet.

## Constraints

- Transitions are decided only in `lifecycle.py`. The approval write is a
  compare-and-set like `set_state`: two concurrent approvals have exactly one winner.
- Nothing below `api/` knows HTTP. Validation of the name lives in the schema.
- `docs/adr/` is human territory: the ADR is drafted as `Proposed`.
- The schema change must be additive (`ADD COLUMN IF NOT EXISTS`).

## Plan

- [x] `RunMetadata` gains `approved_by` and `approved_at`.
- [x] `ArtifactStore.record_approval(run_id, expected, metadata)` sets `APROVADA`
      and writes `meta.json` in one step. Postgres also fills
      `runs.reviewed/approved_by/approved_at`. Local, Postgres, and the `MemoryStore` fake.
- [x] `RunWorkspace.approve(approved_by)`: idempotent on `APROVADA`; otherwise
      `check_transition` + `record_approval`; a lost race to another approval is
      still a success.
- [x] Root route takes `{"approved_by": ...}` and returns state + approval fields.
- [x] `POST /api/v1/questions/{id}/approve` returns `QuestionResource`, which
      gains `reviewed`, `approved_by`, `approved_at`.
- [x] Tests: valid approval, repeated approval, `FALHOU_VERIFICACAO` → 409, empty
      name → 422, persistence after a fresh read, store contract on every backend.
- [x] Docs: API reference (contract for G4-5), lifecycle page, data model. ADR-0016 drafted.

## Decisions taken along the way

- 2026-11-17 — Approver from a required body field, not a header or optional
  body (chosen by Hugo). The issue requires a responsible human, and the backend
  has no session yet.
- 2026-11-17 — Include the `/api/v1` route (chosen by Hugo). The review screen
  already calls it.
- 2026-11-17 — A repeated approval returns the *first* record, even if a
  different name is sent. That is what "does not change its metadata" means in
  the acceptance criteria.

## Verification

- 2026-11-17 — `make check`: all checks passed (backend tests, front-end, docs strict).
- 2026-11-17 — Postgres contract and model tests against a throwaway `postgres:16`
  (`CODEEXPERT_TEST_DATABASE_URL=… pytest tests/integration/test_store.py
  tests/integration/test_question_model.py`): 48 passed, 0 skipped. CI skips them
  without a database, so this run is the evidence for the Postgres path.
