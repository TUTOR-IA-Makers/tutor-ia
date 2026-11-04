# ADR-0014 — Store a structured snapshot of completed generations

- **Status** Proposed
- **Date** 2026-11-04
- **Deciders** the team

## Context

G0-4 stores run artifacts in Postgres behind ArtifactStore (ADR-0012).
Issue #16 requires queryable question fields, ordered test cases and generation
metadata without introducing question versioning or approval roles. Existing
artifact consumers and the local development backend must keep working.

## Decision

Extend `runs` with metadata and nullable usage columns; add `questions` and
`test_cases`, keyed by run_id. On completion, validate and snapshot a full
artifact set in the same transaction that marks the run complete. Serialize
artifact writes and completion on the parent run row. Recompletion replaces
the snapshot and its ordered cases; it does not create a revision.

Keep per-step model, prompt version and timestamp in an ordered JSONB array,
matching RunMetadata. Keep constraints as JSONB and expose difficulty and axis
as checked columns using the existing taxonomy. Axis remains optional for
legacy callers. Generated questions start as drafts: completion is not approval.
Usage columns remain SQL NULL until G2-4 defines collection and cost semantics.

Read the structured snapshot through PostgresStore.get_question. Existing API
reads remain artifact-based. Apply the additive schema idempotently at store
startup, as in ADR-0012; do not automatically backfill legacy generations.

## Alternatives considered

- Replace artifacts immediately: breaks the current workspace contract and
  requires rewriting every generation step for a data-model issue.
- Update relational fields on each generic artifact write: forces parsing and
  question semantics into a contract that also accepts arbitrary text artifacts.
- Add full revisions and approval transitions: outside G1-2, reserved for later stories.
- Store each step in another table: unnecessary for the current read contract;
  JSONB preserves repeated steps and can be normalized when querying requires it.

## Consequences

Completion and snapshot persistence are atomic within Postgres. Cases preserve
order, duplicates and exact stdin/stdout. Deletion cascades through the model.
No additional dependency or model inference is introduced.

Artifacts and structured fields duplicate data. The snapshot explicitly means
the last completed generation; edits to artifacts are not reflected until
recompletion. Generic runs missing required artifacts produce no question row.
The XML export still writes to the filesystem before completion and is not
covered by the database transaction. Postgres-specific tests need a test database.

## Revisit when

G1-7 introduces versions, G2-4 measures usage, or question editing becomes a
separate write path. Those stories must define which representation they update.
