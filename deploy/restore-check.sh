#!/usr/bin/env bash
# Prove a dump restores, without touching the live database:
#
#   deploy/restore-check.sh /srv/codeexpert/backups/codeexpert-20261104T031500Z.dump
#
# Restores into a new database next to the live one, prints what it holds and
# drops it. The output is the evidence the restore was tested. Restoring over
# the live database after a loss is a different, manual procedure: see
# docs/guides/deploy.md.
set -euo pipefail

dump="${1:?usage: restore-check.sh <file.dump>}"
[[ -f "$dump" ]] || { echo "no such file: $dump" >&2; exit 1; }

here="$(cd "$(dirname "$0")" && pwd)"
compose=(docker compose -f "$here/compose.yaml")
db="codeexpert_restore_check_$(date -u +%Y%m%d%H%M%S)"

psql() { "${compose[@]}" exec -T db psql -U codeexpert -v ON_ERROR_STOP=1 "$@"; }

psql -d postgres -qc "CREATE DATABASE $db"
trap 'psql -d postgres -qc "DROP DATABASE IF EXISTS $db WITH (FORCE)"' EXIT

"${compose[@]}" exec -T db pg_restore -U codeexpert -d "$db" --no-owner --exit-on-error < "$dump"

echo "restored $(basename "$dump") into $db:"
psql -d "$db" -c "
  SELECT (SELECT version_num FROM alembic_version)             AS schema_revision,
         (SELECT count(*) FROM runs)                           AS runs,
         (SELECT count(*) FROM runs WHERE status = 'complete') AS complete_runs,
         (SELECT count(*) FROM run_artifacts)                  AS artefacts,
         (SELECT max(created_at) FROM runs)                    AS newest_run"
