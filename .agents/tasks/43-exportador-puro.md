# 43 — [S2][G1-8] Exportador puro, sem arquivo compartilhado

- **Branch** `refactor/43-exportador-puro`
- **Issue** #43
- **Started** 2026-11-19
- **Driver** Hugo Rosa (with Claude Code)

## Goal

Exporting no longer reads, modifies and rewrites `var/questions/Moodle_Questionnaire.xml`.
A pure function turns a list of questions into one Moodle XML, numbered by position in
the list, so two simultaneous exports cannot lose a question. Step 5 returns the XML in
its response.

## Out of scope

- Refusing non-approved questions (G3-4, S4).
- `POST /export` with selected ids (G1-6, S4) — only the interface it will reuse.
- Download from the front end.
- Changes to the templates in `export/templates/` (CODEOWNERS).

## Constraints

- Step 5 still marks the run complete (ADR-0012).
- `export/` must not import FastAPI.
- The response of step 5 has to give the XML somewhere, since the file was the only way out.

## Plan

- [x] `export_questions(questions) -> str` pure; `read_question(workspace)`; `export_run(workspace)` for step 5
- [x] Callers: route, `create_question`, the job
- [x] `ExportResponse.file_path` → `xml`
- [x] Remove `questions_dir` / `CODEEXPERT_QUESTIONS_DIR` (nothing reads it)
- [x] Tests: concurrent exports, numbering by index, pre-existing file ignored, no side effects, errors
- [x] Docs and ADR-0019 (Proposed)

## Decisions taken along the way

- The issue names `export_question`; it became `export_questions` (plural input) plus
  `export_run` for step 5, since one name cannot be both pure and the step that completes
  the run.
- `file_path` is replaced by `xml` in the HTTP response — breaking, documented in
  `docs/reference/api.md` and ADR-0019.
- The rendered XML is not persisted: it is derived from artefacts the store already has.
- Empty list → `ValueError` (a caller bug; G1-6 validates the ids before reaching it).

## Verification

`make check` — see the PR.
