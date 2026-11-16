#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu VPS for CodeExpert (docs/adr/0011,
# docs/guides/deploy.md). Run as root. Safe to run again: it creates what is
# missing, reinstalls the deploy script, and never overwrites a secret or
# production.env that already exists.
#
#   curl -fsSLO https://raw.githubusercontent.com/TUTOR-IA-Makers/tutor-ia/main/deploy/bootstrap-vps.sh
#   less bootstrap-vps.sh                       # read it before running it as root
#   DEPLOY_PUBLIC_KEY="ssh-ed25519 AAAA... deploy@github" bash bootstrap-vps.sh
#
# DEPLOY_PUBLIC_KEY is the public half of the key GitHub Actions deploys with.
# Without it the script still runs, and prints how to add it later.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/TUTOR-IA-Makers/tutor-ia.git}"
ROOT=/opt/codeexpert
SECRETS=/etc/codeexpert/secrets
DEPLOY_USER=deploy
# Inside the containers: `app` in backend/Dockerfile, `postgres` in postgres:16.
API_UID=1000
POSTGRES_UID=999

say() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }
grep -qi ubuntu /etc/os-release || echo "⚠ not Ubuntu — continuing, but this was written for Ubuntu"

say "system packages and automatic security updates"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl git ufw openssl unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

say "Docker Engine and the Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
docker compose version

# Without rotation, container logs grow until the disk is full.
if [[ ! -f /etc/docker/daemon.json ]]; then
  cat >/etc/docker/daemon.json <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "5" } }
EOF
  systemctl restart docker
fi

say "firewall: 22, 80, 443"
# Docker publishes ports through its own iptables rules, ahead of ufw. Only the
# proxy publishes any (deploy/compose.yaml), so 80/443 are the only ones open.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

say "deploy user"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
# Membership of `docker` is root on this machine (docs/adr/0011). The forced
# command below is what keeps the GitHub key from using it freely.
usermod -aG docker "$DEPLOY_USER"

say "checkout in $ROOT/repo"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0755 "$ROOT"
if [[ ! -d "$ROOT/repo/.git" ]]; then
  sudo -u "$DEPLOY_USER" git clone --quiet "$REPO_URL" "$ROOT/repo"
fi

say "deploy script → /usr/local/bin/codeexpert-deploy"
# Root-owned copy: a commit on main cannot change what the deploy key may run.
install -o root -g root -m 0755 "$ROOT/repo/deploy/deploy.sh" /usr/local/bin/codeexpert-deploy

say "secrets in $SECRETS"
# 0711: Docker can reach the files by name, nobody can list the directory.
install -d -o root -g root -m 0711 /etc/codeexpert "$SECRETS"

if [[ ! -s "$SECRETS/llm_api_key" ]]; then
  read -rsp "LLM provider API key (input hidden): " key; echo
  [[ -n "$key" ]] || { echo "empty key" >&2; exit 1; }
  printf '%s' "$key" >"$SECRETS/llm_api_key"
  unset key
fi
chown "$API_UID:$API_UID" "$SECRETS/llm_api_key"
chmod 0400 "$SECRETS/llm_api_key"

if [[ ! -s "$SECRETS/postgres_password" ]]; then
  # Hex, so it needs no escaping inside the connection URL.
  password=$(openssl rand -hex 24)
  printf '%s' "$password" >"$SECRETS/postgres_password"
  printf 'postgresql://codeexpert:%s@db:5432/codeexpert' "$password" >"$SECRETS/database_url"
  unset password
fi
chown "$POSTGRES_UID:$POSTGRES_UID" "$SECRETS/postgres_password"
chmod 0400 "$SECRETS/postgres_password"
chown "$API_UID:$API_UID" "$SECRETS/database_url"
chmod 0400 "$SECRETS/database_url"

say "production.env"
if [[ ! -f "$ROOT/production.env" ]]; then
  install -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0600 \
    "$ROOT/repo/deploy/production.env.example" "$ROOT/production.env"
  echo "  created from the example — EDIT IT: DOMAIN, BASIC_AUTH_USER, BASIC_AUTH_HASH"
fi

say "deploy key"
keys="/home/$DEPLOY_USER/.ssh/authorized_keys"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 "/home/$DEPLOY_USER/.ssh"
if [[ -n "${DEPLOY_PUBLIC_KEY:-}" ]]; then
  line="command=\"/usr/local/bin/codeexpert-deploy\",restrict $DEPLOY_PUBLIC_KEY"
  touch "$keys"
  grep -qxF "$line" "$keys" || printf '%s\n' "$line" >>"$keys"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$keys"
  chmod 0600 "$keys"
  echo "  installed with the forced command"
else
  echo "  DEPLOY_PUBLIC_KEY not set. Rerun with it, or append to $keys:"
  echo "  command=\"/usr/local/bin/codeexpert-deploy\",restrict ssh-ed25519 AAAA... deploy@github"
fi

say "done — values for the GitHub repository variables"
# A Hostinger KVM has its public address on the interface; check it in hPanel.
ip=$(hostname -I | awk '{print $1}')
echo "  VPS_HOST      $ip"
echo "  VPS_HOST_KEY  $ip $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
echo
echo "Next: edit $ROOT/production.env, point DOMAIN's A record at $ip,"
echo "then follow docs/guides/deploy.md from 'Configurar o GitHub'."
