# 42 — [S2][G0-8] Geração como job retomável

- **Branch** `feat/42-geracao-retomavel`
- **Issue** #42
- **Started** 2026-11-18
- **Driver** martinnho (with Claude Code)

## Goal

A generation started with `POST /api/v1/questions` has a job record in the
store (state, current step, error), so a server restart can no longer leave a
question reading `GERANDO` forever. On startup every job still `EM_ANDAMENTO`
becomes `INTERROMPIDO`; the teacher can resume it with
`POST /api/v1/questions/{id}/resume`, which continues from the first step not
yet recorded and never repeats a model call already paid for.

## Out of scope

- A distributed queue (Cloud Tasks, Pub/Sub, a worker process). `BackgroundTask` stays.
- Resuming automatically on startup. A crash-looping job would spend money unattended.
- Retrying a job that `FALHOU` (model error, compilation). Only `INTERROMPIDO` resumes.
- A new question state. `INTERROMPIDO` is the job's state (ADR-0015); `QuestionState` is unchanged.
- The front-end (G4-3, Dupla B). The API adds a `job` field the client may ignore.
- Making the exporter pure (G1-8, #43).
- The RPC routes (`/gen_*`, `/create_question`). They do not create jobs.

## Constraints

- `INTERROMPIDO` must not enter `status`: the front validates it with a closed enum
  (`frontend/src/domain/question.ts`), and ADR-0015 says it is not a question state.
- Nothing below `api/` imports FastAPI; the job logic lives in `generation/job.py`.
- Both backends (`local`, `postgres`) and the test `MemoryStore` keep the same contract.
- The startup sweep is correct only with one API process — true in `deploy/compose.yaml`.

## Plan

- [x] `JobState` + `JobRecord` in `domain.py`
- [x] `ArtifactStore`: `get_job`, `save_job`, `replace_job` (compare-and-set), `interrupt_running_jobs`
- [x] Local (`.job` file), Postgres (`runs.job_*` columns), `MemoryStore`
- [x] `generation/job.py`: record each step, skip recorded steps, failure into the job record, sweep, claim resume
- [x] App lifespan runs the sweep; `POST /api/v1/questions/{id}/resume`; `job` in responses
- [x] Tests: 202 + five steps, persisted progress, simulated restart, resume with LLM call count, errors
- [x] Docs: API reference, architecture, roadmap/plan badges, ADR-0017 (Proposed)

## Decisions taken along the way

- Job state lives in its own columns on `runs` (not in `run_artifacts`), so the
  sweep is one `UPDATE ... WHERE job_state = 'EM_ANDAMENTO'`.
- A step counts as done when `meta.json` records it. A crash between writing an
  artefact and recording it repeats that one step — the narrowest window available
  without a transaction across artefact and metadata.
- `status` for an interrupted job reads `FALHOU_VERIFICACAO` with a reason, the same
  stopgap already used for model failures, so today's progress screen stops polling.
  `job.state` carries the truth for G4-3.
- Runs created before this change have no job record. Nothing can still be running
  them, so they read as `INTERROMPIDO` (or `FALHOU` when `failure.json` exists) and
  can be resumed.

## Verification

See the PR description.
