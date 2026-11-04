# ADR-0013 — The database schema is a chain of Alembic revisions, applied by a Compose service

- **Status** Proposed
- **Date** 2026-11-04
- **Deciders** the team

## Context

ADR-0012 put run artefacts in Postgres. Its first implementation kept the
schema in `store/schema.sql`, and `PostgresStore` ran that file, all
`CREATE … IF NOT EXISTS`, every time it started.

That works for one schema, never changed. It does not work for the next one.
G1-2 adds the question model, and the library (G1-5) will change it again.
`IF NOT EXISTS` cannot add a column to an existing table or rename one, and a
database cannot tell which version of the schema it holds. So "is production at
the schema this commit expects?" has no answer.

Issue #15 (G1-1) asks for three things that follow from that. The schema must
change through a pull request, and migrations must run on deploy, not by hand.
The database must have a daily backup off the VPS, with one tested restore.
And the tests must run against a disposable database while `make check` stays
offline.

The team has no ORM. The store writes SQL through psycopg, and nothing in the
application describes tables as Python classes.

## Decision

**Revisions.** The schema is the chain of Alembic revisions in
`backend/src/codeexpert/store/migrations/versions/`. They are written by hand,
in SQL (`op.execute`), with no autogenerate, because there are no models to
compare against. Revision `0001` is the old `schema.sql`. It keeps
`IF NOT EXISTS`, so a database the old startup code created is adopted instead
of rejected. `schema.sql` is deleted.

**One way to apply them.** `codeexpert migrate` reads the database URL from
`Settings`, from the environment, `.env` or `/run/secrets/codeexpert_database_url`
(ADR-0007). It then upgrades to head. `migrations/env.py` refuses to run
without the connection that command passes in. The `alembic` CLI is still how
a developer writes a new revision (`alembic revision -m …`), through a
`backend/alembic.ini` that holds no URL.

**On deploy.** `deploy/compose.yaml` has three services. `db` is Postgres 16
with a named volume, on an internal network, with no published port. `migrate`
uses the same image as the API, runs `codeexpert migrate` and exits. `api`
starts only after `migrate` has exited with status 0
(`service_completed_successfully`).

**The store checks.** `PostgresStore` no longer creates tables. When it starts,
it compares the database's `alembic_version` with the code's head revision, and
refuses to start if they differ. That way, a skipped migration fails at startup
instead of on the first request.

**Backup.** `deploy/backup.sh` runs from the host's cron. It writes a
`pg_dump --format=custom`, copies it off the VPS with `rsync`, and fails if the
copy fails. `deploy/restore-check.sh` restores a dump into a scratch database
next to the live one, prints what it holds, then drops it. Its output is the
evidence that a restore was tested.

**Tests.** `CODEEXPERT_TEST_DATABASE_URL` names a server, not the database the
tests use. Each test session creates a database with a random name, migrates
it, and drops it with `WITH (FORCE)` at the end. Migration tests get an empty
database each. When the variable is unset, the tests skip, as the `gcc` tests
do, so `make check` needs no service. CI sets the variable and runs a
`postgres:16` service container, so the tests that ADR-0012 said were skipped
in CI now run there.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Keep `schema.sql` with `IF NOT EXISTS` | Cannot alter an existing table, and a database cannot say which version it holds. Fails at the first change to the schema, which G1-2 makes |
| Numbered `.sql` files and a small runner of our own | Possible in ~60 lines, but every edge case is ours to own: the version table, locking, downgrade, two branches adding the same number. Alembic already does this, and the issue names it |
| yoyo-migrations, dbmate, sqitch | Fewer dependencies (dbmate needs no Python), but less familiar to the team, and nothing gained for plain SQL revisions. dbmate would be a second binary in the image |
| Apply migrations when the API starts, as `schema.sql` was | Every replica would race to migrate, and a failing migration would look like a crashing API. A separate one-shot service makes the migration a step of its own, with its own log and exit code |
| Apply migrations from the deploy job over SSH | The job would need the database URL, so the password would pass through GitHub. ADR-0011 keeps secrets on the VPS only |
| Point the tests at the database named in the URL | A developer pointing it at their development database would have it written to. A database of their own per session costs nothing and is dropped at the end |

## Consequences

**Good**

- A change to the schema is a revision file in a PR, reviewed like any other code.
- The deploy migrates on every `up`. An upgrade with nothing to do is a no-op, so there is no "did someone run it?".
- A mismatch between the code and the database fails at startup, with the command that fixes it.
- `make check` stays offline. CI runs the Postgres tests on every PR.
- Two branches that each add a revision on the same parent produce two heads. An offline unit test catches that before merge.

**Bad, or costly**

- Two new runtime dependencies, `alembic` and `sqlalchemy`. SQLAlchemy is only Alembic's connection layer; the application does not use it.
- Revisions are hand-written SQL. Nothing generates them from a model, and nothing checks that a revision matches what the code queries, except the tests.
- The database password exists twice on the VPS: as `postgres_password` for the `db` image and inside `codeexpert_database_url` for the app. Rotating it means changing both files and the role.
- The backup destination, the cron entry and the tested restore depend on the VPS (G0-9, #25), which does not exist yet. Until it does, the scripts are tested only on a developer machine.
- A downgrade is written for every revision but is not part of the deploy. Rolling back a release that migrated means restoring a backup or writing a new revision.

## Revisit when

A migration takes long enough to hold locks that the API would notice: then it
needs to run before the release, not as part of it. Also revisit if the
application adopts an ORM, which would make autogenerate worth having, or if
the database moves out of Compose to a managed service.
