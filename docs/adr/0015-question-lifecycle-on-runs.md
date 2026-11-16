# ADR-0015 — Keep the question lifecycle in one transition table and one column on runs

- **Status** Proposed
- **Date** 2026-11-13
- **Deciders** the team

## Context

Until G3-1 (#39), whether a question could reach a student was a convention.
A run was `draft` or `complete` (ADR-0012), `meta.json` carried a `reviewed`
flag nothing ever changed, and `questions.state` (ADR-0014) was a placeholder
that only accepted `draft`. The plan names five states — `GERANDO`, `GERADA`,
`FALHOU_VERIFICACAO`, `APROVADA`, `REJEITADA` — and requires invalid transitions
to be refused with `409`, approval of a failed question above all.

Three facts constrained the choice:

- A question is `GERANDO` or `FALHOU_VERIFICACAO` before step 5 has run, when
  ADR-0014's `questions` row does not exist yet.
- The local backend must keep working without a database, and the offline
  suite runs against it.
- G3-2 (approval with author and date), G3-3 (editing) and G0-8 (generation as
  a job, with its own `INTERROMPIDO` state) all build on this. Each needs one
  place to ask "is this change allowed?".

## Decision

`QuestionState` in `domain.py` names the five states. `codeexpert/lifecycle.py`
holds the only table of allowed transitions and `check_transition`, which raises
`InvalidTransitionError`; the API maps it to `409` in `STATUS_BY_ERROR`.

| From | To |
| --- | --- |
| `GERANDO` | `GERADA` (step 5 finished), `FALHOU_VERIFICACAO` (step 4 could not compile or finish) |
| `FALHOU_VERIFICACAO` | `GERANDO` (step 4 runs again), `REJEITADA` |
| `GERADA` | `APROVADA`, `REJEITADA` |
| `APROVADA`, `REJEITADA` | nothing |

Code changes a state only through `RunWorkspace.transition`, which checks the
table and then calls `ArtifactStore.set_state(run_id, expected, new)`: a
compare-and-set, so two concurrent reviewers cannot both succeed from `GERADA`.
Postgres stores the state in `runs.state` with a `CHECK` that a unit test ties to
the enum; the local backend stores it in a `.state` file per run. A run finished
before this change reads as `GERADA` on both backends. The `draft`-only
`questions.state` column is dropped.

The state is independent of `runs.status`. `status` still says whether the
artefacts are complete; `state` says what has been decided about the question.
Completing a run moves only `GERANDO` to `GERADA`: finishing step 5 again does
not erase a review or a failed verification.

Review actions are `POST /questions/{run_id}/approve` and `/reject`. A missing
compiler is the server's failure, not the question's, and changes no state.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| State on `questions` | The row only exists after step 5; `GERANDO` and `FALHOU_VERIFICACAO` would have nowhere to live |
| Replace `runs.status` with the state | `status` is the artefact store's contract (ADR-0012) and is read by code that knows nothing of review; merging them couples the two and changes ADR-0014's completion transaction |
| Check transitions in SQL (a trigger or `CASE`) | The rule would exist twice, once per backend, and the local backend has no SQL |
| Generic `PATCH /questions/{id}/state` | Lets a client claim pipeline states such as `GERADA`; approval needs its own endpoint anyway once G3-2 records who approved |
| Let `APROVADA` go back to `GERADA` on edit now | G3-3 has not decided what editing a reviewed question means; a terminal state is the safe default until it does |

## Consequences

**Good**

- "Can this reach a student?" is `state = 'APROVADA'`, one column.
- Every caller — pipeline, API, a future job runner — goes through one check.
- Invalid changes are `409` with a message naming both states and what to do.

**Bad, or costly**

- Completion and its state change are two statements in Postgres. A process
  that dies between them leaves a complete run in `GERANDO`; the schema script
  repairs it on the next start.
- The local backend's compare-and-set is not atomic across processes.
- Running generation steps on an `APROVADA` question still overwrites its
  artefacts without un-approving it. The stored snapshot changes on the next
  completion. G3-3 must close this.
- Approving twice is a `409` here; G3-2 is expected to make it idempotent.

## Revisit when

G3-3 defines editing of a reviewed question, G0-8 moves generation into a job
(its `INTERROMPIDO` is the job's state, not the question's), or G3-2 needs an
approval record richer than a state.
