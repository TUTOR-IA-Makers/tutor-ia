# ADR-0016 — Record the approval on runs, written with the state, and make approving idempotent

- **Status** Proposed
- **Date** 2026-11-17
- **Deciders** the team (draft written by an agent; a person accepts)

## Context

G3-1 (ADR-0015) gave questions a lifecycle. `POST /questions/{id}/approve` moved
`GERADA` to `APROVADA` and nothing else. `meta.json` still carried a `reviewed`
flag nothing changed, and a second approval was a `409`. ADR-0015 recorded both
gaps and expected G3-2 (#40) to close them.

G3-2 asks for three things: a responsible human and an instant on every approval;
`reviewed: true`; and idempotency, meaning a repeated approval neither duplicates
the record nor changes it. Approving a question that failed verification must
stay a `409`.

Four facts constrained the choice:

- **No session yet.** ADR-0013 plans a cookie session (G8-1), but no route knows
  who is calling. The approver can only come from the request.
- **Two backends.** The local backend has no SQL. Postgres has structured columns
  on `runs` (ADR-0014) that the library and the export will read.
- **Compare-and-set.** ADR-0015 already makes `set_state` a compare-and-set so
  two reviewers cannot both win. A record written in a separate step could
  disagree with the state: either an `APROVADA` question with no approver, or
  the approver of the request that lost.
- **The review screen already calls `/api/v1/questions/{id}/approve`.** It
  expects the whole question back (`frontend/src/services/http/createHttpServices.ts`).

## Decision

1. `RunMetadata` gains `approved_by` and `approved_at` (ISO 8601, UTC, set by
   the server). Approving sets them and `reviewed: true` in `meta.json`. Postgres
   also adds `runs.approved_by` (text) and `runs.approved_at` (timestamptz),
   additively. It fills `runs.reviewed`, which until now changed only on completion.
2. `ArtifactStore.record_approval(run_id, expected, metadata)` sets `APROVADA` and
   stores the record **in one step**, only if the state is still `expected`.
   Postgres does this in one transaction, guarded by `UPDATE … WHERE state = expected`.
   The local store writes the record first and the state second. If it crashes
   in between, the question is still `GERADA` and the next approval overwrites
   the orphaned record.
3. `RunWorkspace.approve(approved_by)` decides:
   - Already `APROVADA`: return the stored record and write nothing.
   - Otherwise: `check_transition`, as every state change does.
   - A lost race to another approval is also a success, with the winner's record.
4. The approver's name is a **required body field**,
   `{"approved_by": "..."}`. It is stripped, and blank is a `422`. When the
   session exists, the name comes from it and the field is removed.
5. The same action is exposed as `POST /api/v1/questions/{id}/approve`, which
   answers with the whole `QuestionResource`. That resource gains `reviewed`,
   `approved_by`, and `approved_at`.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| `transition(APROVADA)` then `write_metadata` | Two writes: a crash leaves `APROVADA` with no approver, and the loser of a race could overwrite the winner's name |
| A separate `approvals` table, one row per approval | The issue asks for one responsible person per question, not a history. Versioning is G1-7's job |
| Repeated approval returns `409` (as in ADR-0015) | The issue requires idempotency. A double click or a retry after a timeout must not look like an error |
| Repeated approval with a new name updates the record | "Does not change its metadata" in the acceptance criteria. The first person to approve remains responsible |
| Approver in a header, or an optional body | A header is invisible in the Swagger UI and easy to forget. An optional name defeats "a human responsible for every question" |
| Wait for the session (G8-1) | G3-2 is P0 for S2; G8-1 is not. The body field is a stopgap with a named exit |

## Consequences

**Good**

- "Who is responsible for this question?" is answered by the same record that
  makes it `APROVADA`; the two cannot disagree on Postgres.
- Retries and double clicks are harmless.
- Exporting only approved questions (G3-4) can read `runs.approved_by` directly.

**Bad, or costly**

- The name is whatever the client sends; nothing proves who pressed the button
  until there is a session. Treat it as a declaration, not an identity.
- The local backend's write is not atomic across processes, like its
  `set_state` (ADR-0015).
- `ArtifactStore` grows a method that knows about `meta.json` and approval, not
  only artefacts and state.
- The frontend's approve call sends no body and gets `422` until G4-5 sends
  `approved_by`.

## Revisit when

The session exists (G8-1): remove the body field and take the approver from it.
Also reopen this if G3-3 lets an approved question be edited or un-approved, which
must decide what happens to the record, or if a history of reviews is required.
