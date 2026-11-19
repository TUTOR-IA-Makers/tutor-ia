# ADR-0017 — Keep the generation job's state on runs, interrupt it on startup, and resume from the last recorded step

- **Status** Proposed
- **Date** 2026-11-18
- **Deciders** the team (draft written by an agent; a person accepts)

## Context

Since #38, `POST /api/v1/questions` answers `202` and runs the five steps in a
FastAPI `BackgroundTask`, in the API process. Nothing recorded that a job was
running. If the process stopped mid-job — a deploy, `make run` reloading, the
container's memory cap — the question read `GERANDO` forever, and the teacher
found out from the silence. A failure caught by the job went to a
`failure.json` artefact.

G0-8 (#42) asks for four things: the job's state, current step and error in the
database; `INTERROMPIDO` instead of an eternal `GERANDO` after a restart; the
steps already finished, model calls included, kept; and resuming without paying
for them again. A distributed queue is out of scope: the plan accepts
`BackgroundTask` for v1.0.

Five facts constrained the choice:

- ADR-0015 already decided that `INTERROMPIDO` is the job's state, not the
  question's. The question lifecycle table must not grow a state that says
  nothing about what a teacher decided.
- The web client validates `status` with a closed enum of the five question
  states (`frontend/src/domain/question.ts`). A sixth value would fail every
  response for a question in it. Unknown keys are dropped, so a new field is safe.
- Production runs exactly one API process (`deploy/compose.yaml`): one
  container, one uvicorn worker.
- Every step that calls the model already records itself in `meta.json` after
  writing its artefact (`record_step`), and each step reads only what earlier
  steps wrote.
- The local backend must keep working without a database.

## Decision

**A job record next to the question state.** `JobState` (`EM_ANDAMENTO`,
`INTERROMPIDO`, `FALHOU`, `CONCLUIDO`) and `JobRecord` (state, step, teacher-facing
reason, exception class, `updated_at`) live in `domain.py`. `ArtifactStore` gains
`get_job`, `save_job`, `replace_job` (compare-and-set on the state) and
`interrupt_running_jobs`. Postgres keeps the record in `runs.job_*` columns, with
a `CHECK` a unit test ties to the enum; the local backend in a `.job` file.

**Written as the job goes.** `POST /api/v1/questions` saves `EM_ANDAMENTO`
before the draft, so a question is never visible without a job. Before each step
the job saves `EM_ANDAMENTO` with that step's name; at the end `CONCLUIDO`; a
caught exception `FALHOU` with the reason and the exception class. New failures
no longer write `failure.json`.

**Interrupted on startup.** The app's lifespan calls
`interrupt_running_jobs()`: one `UPDATE … WHERE job_state = 'EM_ANDAMENTO'`. At
that moment no job can be running in this process, so any that says so is
`INTERROMPIDO`. The step is kept, so the record says where it stopped. A store
that cannot be reached is logged and does not stop the server.

**Resumed on request, from the first unrecorded step.**
`POST /api/v1/questions/{id}/resume` claims an `INTERROMPIDO` job by
compare-and-set (`409` otherwise) and runs the same `run_generation`. It skips
every step from the start that `meta.json` records and runs everything from the
first gap. No model call already recorded is made again.

**Reported without a new `status`.** `GenerationResponse` and `QuestionResource`
gain a `job` object (`state`, `step`, `resumable`, `updated_at`). For an
interrupted job, `status` reads `FALHOU_VERIFICACAO` with a reason, the stopgap
already used for model failures, so today's progress screen stops polling.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| `INTERROMPIDO` as a sixth `QuestionState` | ADR-0015 rejected it, and the client's closed enum would fail on every response that carried it |
| Job state as a `job.json` artefact | Artefacts are text in `run_artifacts`; the startup sweep would have to parse JSON in SQL, and a compare-and-set on content is awkward |
| A heartbeat, with "stale for N seconds" meaning interrupted | Steps block on the model for up to the provider timeout times the retries; any N either flags live jobs or waits minutes to notice a dead one. A restart is the only event that kills a job here, and startup sees it exactly |
| A per-process boot id on each job, compared on read | Same result with one process; with several it misreads every other process's live jobs, and it spreads the check over every read |
| Resume automatically on startup | A job that kills the process would kill every restart after it, spending a model call each time. A person clicking Retomar is the rate limit |
| Count a step as done when its artefact exists | Steps write the artefact before recording model and prompt; a run resumed from an unrecorded artefact would lose its traceability (EPIC-017). Recorded steps are the safer source |
| Cloud Tasks, Pub/Sub or a worker process | Out of scope for v1.0 by the plan. `run_generation` is the function such a worker would call; only the caller changes |

## Consequences

**Good**

- A restart can no longer leave a question polling forever: the next start marks
  it `INTERROMPIDO`, and the API says so with a reason.
- Resuming costs only the steps not yet recorded. The suite counts the model
  calls to prove it.
- Failures, the step they happened in and the exception class are in the
  database, next to the state, rather than in an artefact.
- The client needs no change to stop polling; G4-3 can offer Retomar from
  `job.resumable`.

**Bad, or costly**

- The sweep is correct only with one API process. A second process starting
  would interrupt the first one's live jobs. Adding workers or replicas requires
  revisiting this.
- A step that dies after writing its artefact and before recording itself runs
  again on resume: at most one repeated call, the narrowest window without a
  transaction across artefact and metadata.
- Export appends to the shared questionnaire file before completing the run; a
  crash between the two exports the question twice. G1-8 (#43) removes the file.
- `status` still reads `FALHOU_VERIFICACAO` for a job that failed or was
  interrupted before verification ran. `job.state` is the truth; the lifecycle
  still has no way to reject such a question.
- Only `INTERROMPIDO` resumes. A job that `FALHOU` on a transient model error
  must be created again, paying for its finished steps.
- Runs from before this change have no job record. An unfinished one reads as
  `INTERROMPIDO` (or `FALHOU` when it has `failure.json`) and can be resumed.

## Revisit when

The API runs in more than one process or replica; a queue or worker replaces
`BackgroundTask`; or teachers ask to retry jobs that failed on the model.
