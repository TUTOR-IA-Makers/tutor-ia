# 41 — [S2][G1-5] Listar, filtrar e buscar

- **Branch** `feat/41-listar-questoes`
- **Issue** #41
- **Started** 2026-11-19
- **Driver** Hugo Rosa (with Claude Code)

## Goal

`GET /api/v1/questions` lists the questions created through the resource API,
newest first, paginated, with optional filters by content, axis, difficulty
band and state, and a text search over the title, statement and context. The
response is the `{items: [...]}` shape `frontend/src/services/http/dto.ts`
already validates, plus pagination fields, so the library (G4-6) can switch
from mock data without a contract change.

## Out of scope

- Wiring the front-end library to the endpoint (G4-6, Dupla B).
- Pushing filters into SQL. One query fetches the rows; filtering is Python.
- Ownership ("minhas questões"): there is no session yet (G8-1), so the list
  is everyone's questions.

## Constraints

- `ArtifactStore` stays agnostic of drafts and statements: it lists runs and
  the artefacts asked for, nothing more.
- Field names and query parameter names follow the front-end (`q`, `content`,
  `difficulty`, `status`), as every other `/api/v1` route does.
- Dependency direction: the filter logic lives in `api/`, beside `drafts.py`,
  because it speaks the draft's vocabulary.

## Plan

- [x] `ArtifactStore.list_runs(names)` in local, Postgres and the test `MemoryStore`
- [x] `api/library.py`: pure filter, sort and paginate
- [x] `GET /api/v1/questions` with validated query parameters
- [x] Unit tests for the pure function, integration tests through the API, store contract test
- [x] `docs/reference/api.md` and `docs/architecture/frontend-integracao.md`

## Decisions taken along the way

- Questions in any state are listed (the library has a GERANDO badge and a
  state filter), but only runs with `draft.json`: RPC runs are not questions to
  `/api/v1`, same as `GET /api/v1/questions/{id}`.
- `difficulty` takes the front-end band ids (`muito-facil` … `muito-dificil`)
  and matches by overlap with the draft's rating range, as the front's mock does.
- Search is case- and accent-insensitive, done in Python because Postgres
  `unaccent` is an extension we would have to install.
- A page past the end is `200` with empty `items` and the real `total`.

## Verification

- `make check`: all checks passed (backend, front-end, docs in strict mode).
- `tests/integration/test_store.py -k postgres` against a throwaway
  `postgres:16-alpine` container: 12 passed, including the new `list_runs`
  contract test. CI skips these without `CODEEXPERT_TEST_DATABASE_URL`.
- ADR-0017 drafted as Proposed: filtering in Python departs from what ADR-0012
  hoped the database would do for the library; a person must accept it.
