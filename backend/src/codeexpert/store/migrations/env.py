"""Alembic's entry point, run by `codeexpert.store.migrate`. See docs/adr/0013.

There is deliberately one way in: `codeexpert migrate`, which reads the database
URL from `Settings` (environment, `.env` or `/run/secrets`) and passes the open
connection here. A second path through `alembic.ini` would need the URL a second
time, in a file, next to the code.
"""

from alembic import context

connection = context.config.attributes.get("connection")
if connection is None:
    raise SystemExit(
        "Apply migrations with `codeexpert migrate`, not the alembic command. "
        "`alembic revision -m ...` is fine: it does not run this file."
    )

# No `target_metadata`: the application has no ORM models, so revisions are
# written by hand, in SQL, and autogenerate has nothing to compare against.
context.configure(connection=connection, target_metadata=None)

with context.begin_transaction():
    context.run_migrations()
