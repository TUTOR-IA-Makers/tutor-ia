# ADR-0017 — List the library with one store call and filter it in Python

- **Status** Proposed
- **Date** 2026-11-19
- **Deciders** the team (draft written by an agent; a person accepts)

## Context

G1-5 (#41) asks for `GET /questions` with optional filters by axis, level and
state, a text search over the statement, pagination, newest first. The library
screen (G4-6) already calls `GET /api/v1/questions` with `q`, `content`,
`difficulty` and `status`, and validates `{items: [...]}`
(`frontend/src/services/http/dto.ts`). ADR-0012 moved runs to Postgres partly so
the library could be queried instead of walking a directory tree.

Five facts constrained the choice:

- **Two backends.** `LocalFilesystemStore` has no SQL and is what development
  and the offline suite run on. Whatever filters Postgres applies, the local
  store must apply the same, or the tests prove nothing about production.
- **Every state is listed.** The library shows `GERANDO` and
  `FALHOU_VERIFICACAO` badges and filters by state. The structured `questions`
  table (ADR-0014) only has rows for completed runs, so it cannot be the source.
- **The filters speak the draft's vocabulary.** Content ids, rating ranges and
  band ids live in `draft.json` and `api/drafts.py`, not in the store.
- **Accent-insensitive search.** Teachers type "funcao" for "Função". In
  Postgres that needs the `unaccent` extension, which the deployment does not
  install today.
- **Size.** A course's bank is hundreds of questions, not millions.

## Decision

1. `ArtifactStore` gains `list_runs(names) -> list[RunListing]`: every run, its
   state, and the requested artefacts it has. It knows nothing about drafts.
   Postgres answers it in one query (`runs LEFT JOIN run_artifacts`); the local
   store reads each run directory.
2. `codeexpert.api.library` is a pure function from those listings and a
   `LibraryQuery` to a `QuestionPage`: it drops runs without `draft.json`,
   filters, sorts by `meta.json → created_at` (ties by run id), and slices the
   page. The same code runs for both backends.
3. A page past the end is `200` with empty `items` and the real `total`.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Filters, sort and `LIMIT/OFFSET` in SQL | A second implementation for the local store, kept equal by hand; needs `unaccent`; JSON in `run_artifacts.content` is text, so every filter is a cast. Worth it only when the bank is large |
| Read the structured `questions` table | Misses every question that is not complete, which the library must show |
| `list_run_ids()` and one `get` per artefact | Four round trips per question per request on Postgres |
| Return `400` for a page past the end | The client may hold a page number from before a filter narrowed the list; the issue asks for no error |

## Consequences

**Good**

- One set of rules, tested once without a database (`tests/unit/test_library.py`),
  holds for both backends.
- The store protocol grows by one generic method, not by a query language.
- One database round trip per listing.

**Bad, or costly**

- Every request reads every run's draft, metadata, statement and test cases.
  Cost grows linearly with the bank, and the work ADR-0012 hoped to give the
  database is done in the API process.
- `total` and pagination are computed after loading everything, so a large page
  number costs the same as the first page.
- Runs started through the RPC routes are fetched and then discarded.

## Revisit when

A listing takes more than 300 ms at the 95th percentile in production, or the
bank passes about 5 000 runs. Then move the filters into SQL behind the same
`LibraryQuery`, keeping `tests/unit/test_library.py` as the specification.
