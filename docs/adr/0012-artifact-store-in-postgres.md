# ADR-0012 — Run artefacts live in Postgres behind an `ArtifactStore` protocol

- **Status** Proposed
- **Date** 2026-11-02
- **Deciders** the team

## Context

ADR-0003 gave every generation run its own scope, and the implementation was a
directory, `var/runs/<run_id>/`, that is the only record of the run (this ADR
keeps the scope and changes where it is stored): statement, solution, inputs, test
cases and `meta.json`. `RunWorkspace.open()` decides whether a run exists by
asking `root.is_dir()`.

On the Hostinger VPS (ADR-0011) `var/` sits on a volume, so the current code
already survives a restart and a deploy. Ephemeral disk is not the problem. The
problem is what files cannot do:

- **Query.** The library (G1-5) has to list and filter questions. With files that
  means walking a directory tree and parsing JSON on every request.
- **Transactions.** A run that fails halfway leaves its earlier artefacts on
  disk, indistinguishable from a finished one. Nothing marks a run as complete,
  so nothing can hide an unfinished one (G0-8, G3).
- **Backup.** A client's question bank must have one place to back up. Today it
  is a directory tree that has to be copied consistently while the app writes
  to it.

There is a second, smaller problem. Step 4 hands the solution to `gcc` by path,
so the compiler genuinely needs a file. That is a need of one step, not a reason
for the whole run to live on disk.

## Decision

Artefacts are read and written through an `ArtifactStore` protocol, in the same
spirit as `CodeRunner` in ADR-0004:

- `LocalFilesystemStore` — a directory per run, as today. The default for
  development and for offline tests.
- `PostgresStore` — two tables, `runs` and `run_artifacts`. Used in production,
  selected by `CODEEXPERT_STORE_BACKEND=postgres`.

`RunWorkspace` keeps its public API (`read_json`, `write_json`, `read_text`, …)
and holds a store instead of a directory. `RunWorkspace.open()` asks the store
whether the run exists; it no longer touches the filesystem.

A run has a status, `draft` until step 5 finishes and `complete` after. Only
`complete` runs are visible to the library and to `GET /questions/{id}`. A run
that fails partway stays `draft`: it can still be resumed by `run_id`, and it is
never shown as a question.

The disk becomes scratch space for one step. Test-case generation writes the
`.c` file and the binary to a temporary directory, compiles and runs there, and
deletes the directory when the step ends, including when it fails. Nothing else
in the pipeline needs a path.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Keep the files and index them in a side database (SQLite or Postgres) | Two sources of truth that drift apart. The first crash between writing a file and writing its index row makes them disagree, and nothing says which one is right |
| Move artefacts to object storage (S3-style) with a pointer in Postgres | Right answer for large blobs; artefacts here are a few kilobytes of text. Adds a service, credentials and a consistency problem between bucket and table for no gain at this size |
| A `JSONB` document per run instead of one row per artefact | Rewrites the whole document on every step, and two steps racing on one run overwrite each other. A row per artefact only conflicts on the same artefact |
| Keep files and add a `.complete` marker plus a directory scanner | Solves hiding unfinished runs and nothing else. Still no query, no transaction, no single backup |
| Postgres only, no local store | Every developer and every offline test would need a database, which breaks the rule that `tests/unit` and `tests/integration` run without network or services |

## Consequences

**Good**

- The library can be queried with SQL, and a run's completeness is one column.
- A run is no longer tied to one machine's disk: another process can open it and
  finish the remaining steps.
- Backup is `pg_dump` of one database.
- The rest of the pipeline does not change. `statement.py`, `inputs.py` and
  `_trace.py` already talk to `RunWorkspace` and never to a path.

**Bad, or costly**

- A new runtime dependency (`psycopg`) and a new service in the VPS compose file.
  The app no longer starts in production without a reachable database.
- Two implementations of the same contract. The contract test must run against
  both, and the Postgres half needs a database, so it is skipped when
  `CODEEXPERT_TEST_DATABASE_URL` is unset. It does not run in CI until the
  workflow provides one.
- `record_step` still reads, changes and rewrites `meta.json` as a whole. Two
  concurrent writers to one run can lose a step record. This is the same
  behaviour as today and is not fixed here; it is what G0-8 is for.
- The Moodle questionnaire file is still written to `var/questions/`. Moving it
  is not part of this decision.
- Existing runs under `var/runs/` are not migrated. They are development
  output, and `var/` is ignored by git.

## Revisit when

An artefact regularly exceeds a few megabytes, or the database starts to be
backed up mainly for blobs it should not hold: then artefact content moves to
object storage and Postgres keeps only the pointer and the status. Also if the
single Postgres instance stops being a prerequisite of the deploy.
