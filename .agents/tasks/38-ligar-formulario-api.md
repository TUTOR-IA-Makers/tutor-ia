# 38 — [S1][G4-2×G1-2] Ligar o formulário à API: criar, acompanhar e ler questão em /api/v1

- **Branch** `feat/38-ligar-formulario-api`
- **Issue** #38
- **Started** 2026-11-05
- **Driver** martinnho

## Goal

With the front-end in `http` mode, a teacher fills in the form, watches the
generation progress and reads the generated question, and the question ends up
in Postgres. The backend gains `POST /api/v1/questions` (`202 {id}`, the five
steps in a background task), `GET /api/v1/questions/{id}/generation` and
`GET /api/v1/questions/{id}`, in the shapes `frontend/src/services/http/dto.ts`
already expects. A failure halfway is recorded and shown as
`FALHOU_VERIFICACAO`, never as `GERADA`.

## Out of scope

- Session, accounts, invites (F1, G8-1). No `/api/v1/session` stub: the front
  already treats a failed `/session` as "no teacher" (the `UserMenu`
  placeholder). This branch adds only a test that proves it.
- `GET /api/v1/questions` (list), approve/reject/edit/regenerate, `/exports/moodle`.
- Resuming an interrupted job, "do not repeat a paid step" (full G0-8). A
  server restart mid-generation leaves the run `GERANDO` forever. Documented.
- Deploy (#25), Alembic migrations (#15), any schema change.
- `prompts.py` and export templates. So `context`, `test_case_hints` and the
  structures without a `Constraints` flag reach the database but not the prompt.

## Constraints

- AGENTS.md rule 4: expected outputs come from running the solution. Reuse
  `create_question` unchanged; it already does.
- Rule 5: the integration page marks the resource API as planned. Move only
  what this branch builds to "Implementado", and keep the rest planned.
- Nothing below `api/` imports FastAPI: the job (run, catch, record failure)
  lives in `generation/`, the route only schedules it.
- The RPC routes keep working unchanged.
- The branch is based on `develop`, not `main`: `main` lacks the #16
  persistence this issue builds on (`git.md` and `new-task.sh` say `main`; that
  mismatch is a separate issue).

## Plan

- [x] `api/drafts.py`: the form's request model and a pure `draft → Constraints` mapping
- [x] `generation/job.py`: run the pipeline in the background, record `failure.json` with a Portuguese reason, read progress
- [x] `api/routes/resources.py`: the three routes under `/api/v1`
- [x] Unit tests for the mapping; integration tests with the fake LLM: success, failure, 422s, 404s
- [x] Front-end: test that a failed `/session` does not block the app
- [x] Docs: `reference/api.md`, `architecture/frontend-integracao.md`, local demo guide in `docs/guides/`

## Decisions taken along the way

- **`content_id` maps to the four axes of `docs/product/taxonomy.md`.** The form
  sends one of ten content ids (`frontend/src/domain/contents.ts`), not a
  `ContentAxis`. A fixed table: `entrada-saida` → fundamentos;
  `condicionais`, `repeticao` → controle de fluxo; `vetores`, `matrizes`,
  `strings`, `ponteiros`, `structs` → estruturas de dados e ponteiros;
  `funcoes`, `recursao` → modularização. Anything else is a 422.
- **Difficulty: use the band of `difficulty_max`** (the issue's option "usar
  max"). Requiring `min == max` would reject the form's own default range
  (1200–1600). The bands copy `DIFFICULTY_BANDS` from
  `frontend/src/domain/difficulty.ts`; a unit test pins each boundary.
  **Provisional, to confirm at the team meeting.**
- **Structures to flags, by group.** `if` → `can_has_if`; `else` →
  `can_has_else`; `for`/`while`/`do-while` → `can_has_repetition`;
  `funcao`/`recursao`/`passagem por referencia` → `can_has_function`;
  `vetor`/`matriz` → `can_has_matrix` (the prompt line says "vetores ou
  matrizes"). Required or allowed in a group → `True`; otherwise forbidden →
  `False`; otherwise the `Constraints` default. The same id in two lists is a 422.
- **Failure is an artefact, `failure.json`, not a new `runs.status`.** The
  `status` CHECK only allows `draft`/`complete`, and changing it needs a
  migration (#15). An artefact works for both stores with no schema change.
- **The original draft is stored as `draft.json`.** The axis cannot be mapped
  back to the teacher's `content_id`, nor a band to the rating range. A run
  without `draft.json` (created by the RPC routes) is a 404 under `/api/v1`.
- **`GET /questions/{id}` answers in every state.** The front loads the
  question before showing the progress screen (`routes/QuestionPage.tsx`), so a
  `GERANDO` question returns what exists so far. It reads artefacts (works on
  both stores), not `PostgresStore.get_question()`.
- **`code` is the run id.** There is no question numbering in the backend, and
  inventing one is worse than a long id.
- **Routes are `def`, not `async def`,** so the blocking store calls run in the
  thread pool. The background job is a plain function for the same reason.

## Verification

- `make check` (2026-11-05): all checks passed — backend format, lint, tests;
  front-end format, lint, types, 440 tests, build, bundle, audit; docs strict.
  The npm audit step prints a moderate `fast-uri` advisory and still passes (#26).
- Backend suite against a throwaway Postgres 16
  (`CODEEXPERT_TEST_DATABASE_URL`): 163 passed, none skipped.
- By hand, against the same Postgres with a fake LLM and runner: one draft that
  succeeds and one whose compilation fails, through `POST` → `/generation` →
  `GET`. Success: `202`, `GERADA`, 5 steps; `runs.status = complete`, one row in
  `questions` (`difficulty = medio`, `axis = controle de fluxo`) and two in
  `test_cases` with the runner's outputs. Failure: `FALHOU_VERIFICACAO`, 3
  steps, Portuguese reason; run stays `draft`, no `questions` row,
  `failure.json` in `run_artifacts`.
- Not done: a real generation with a real key through the browser
  (`docs/guides/form-to-database.md`). Needs a key and costs a generation.
- Open for the team: difficulty uses the band of `difficulty_max` (provisional).
