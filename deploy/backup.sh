#!/usr/bin/env bash
# Daily dump of the database, copied off the VPS. Run by the host's cron:
#
#   15 3 * * *  CODEEXPERT_BACKUP_DIR=/srv/codeexpert/backups \
#               CODEEXPERT_BACKUP_REMOTE=backup@host:codeexpert \
#               /srv/codeexpert/repo/deploy/backup.sh >> /var/log/codeexpert-backup.log 2>&1
#
# A copy on the same disk is not a backup: the script fails if the remote copy
# fails. See docs/adr/0013 and docs/guides/deploy.md.
set -euo pipefail

: "${CODEEXPERT_BACKUP_DIR:?directory on the VPS for the dumps}"
: "${CODEEXPERT_BACKUP_REMOTE:?rsync destination off the VPS, e.g. user@host:path}"
KEEP_DAYS="${CODEEXPERT_BACKUP_KEEP_DAYS:-14}"

here="$(cd "$(dirname "$0")" && pwd)"
compose=(docker compose -f "$here/compose.yaml")

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump="$CODEEXPERT_BACKUP_DIR/codeexpert-$stamp.dump"

umask 077
mkdir -p "$CODEEXPERT_BACKUP_DIR"

# Custom format: compressed, and pg_restore can restore it table by table.
# Written under another name first, so a half-written dump is never mistaken
# for a good one by the copy or by the cleanup below.
"${compose[@]}" exec -T db pg_dump -U codeexpert -d codeexpert --format=custom > "$dump.partial"
mv "$dump.partial" "$dump"

rsync --archive "$dump" "$CODEEXPERT_BACKUP_REMOTE/"

# Only local copies are pruned. What is kept off the VPS is decided there.
find "$CODEEXPERT_BACKUP_DIR" -name 'codeexpert-*.dump' -mtime +"$KEEP_DAYS" -delete

echo "$(date -u +%FT%TZ) backup ok: $(basename "$dump") ($(du -h "$dump" | cut -f1))"
