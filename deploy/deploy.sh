#!/usr/bin/env bash
# Deploy one commit of main to this VPS. The ONLY thing the deploy key may run:
# its authorized_keys line is
#
#   command="/usr/local/bin/codeexpert-deploy",restrict ssh-ed25519 AAAA... deploy@github
#
# so whatever the client asks for arrives in SSH_ORIGINAL_COMMAND and is treated
# as data, never executed. It must be a full 40-character commit SHA.
#
# Installed by bootstrap-vps.sh as a root-owned copy. Editing this file in the
# repository changes nothing on the VPS until a person reinstalls it; that is the
# point (docs/adr/0011).
#
#   codeexpert-deploy <sha>        by hand, as the deploy user
set -euo pipefail

sha="${SSH_ORIGINAL_COMMAND:-${1:-}}"
if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: codeexpert-deploy <40-character commit sha>" >&2
  exit 2
fi

root="${CODEEXPERT_ROOT:-/opt/codeexpert}"
repo="$root/repo"
env_file="$root/production.env"

# One deploy at a time, even if the workflow's own queue ever lets two through.
exec 9>"$root/deploy.lock"
if ! flock --nonblock 9; then
  echo "another deploy is running" >&2
  exit 1
fi

# The Compose file comes from the commit being deployed, and only from main:
# a SHA from a branch or a fork is refused before anything changes.
git -C "$repo" fetch --quiet origin main
if ! git -C "$repo" merge-base --is-ancestor "$sha" origin/main; then
  echo "$sha is not on origin/main — refusing to deploy it" >&2
  exit 1
fi
git -C "$repo" checkout --quiet --force --detach "$sha"

compose=(docker compose --env-file "$env_file" -f "$repo/deploy/compose.yaml")
export SHA="$sha"

echo "→ pulling $sha"
"${compose[@]}" pull --quiet api
echo "→ starting"
# --wait returns once api is healthy (its HEALTHCHECK), or fails the deploy.
"${compose[@]}" up --detach --remove-orphans --wait --wait-timeout 180

# Every deploy leaves the previous image behind. Keep a month for rollbacks.
docker image prune --all --force --filter "until=720h" >/dev/null

"${compose[@]}" ps
echo "✓ deployed $sha"
