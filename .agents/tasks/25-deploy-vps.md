# 25 — [G0-9] Deploy contínuo na VPS da Hostinger

- **Branch** `feat/25-deploy-vps`
- **Issue** #25
- **Started** 2026-11-16
- **Driver** HugoRosa29

## Goal

Every green `CI` on `main` ships that commit to one Hostinger VPS without anyone
touching it. The VPS runs a Compose project with `api`, `db` (Postgres 16) and
`proxy` (Caddy with TLS), where only the proxy publishes ports. Secrets live
only on the VPS as files under `/run/secrets`. `GET /health` on the production
URL reports the SHA of `main`. The one-time VPS setup is a script plus a guide,
so it can be redone from scratch.

## Out of scope

- The front-end in the image (G4-1 follow-up). The production URL serves the API only.
- Invite-based access (G8-1). It is replaced for now by HTTP basic auth on the
  proxy, see the decisions below.
- Alembic, `pg_dump` and restore (G1-1). The schema is still applied by
  `PostgresStore` on startup, as it is today.
- `read_only` filesystem and the G8-3 checklist. Only `mem_limit` and `pids_limit`
  are set.

## Constraints

- ADR-0011 (accepted in this branch): GHCR, SSH with forced command, secrets as files.
- `.github/workflows/` and `docs/adr/` need CODEOWNERS review (AGENTS.md §7).
- AGENTS.md rule 5: nothing here has run on a VPS yet. The docs say what is in the
  repository, not that production exists.
- No new dependency.

## Plan

- [x] Record ADR-0011 as accepted, ADR-0010 as superseded
- [x] `deploy/compose.yaml`, `deploy/Caddyfile`, `deploy/production.env.example`
- [x] `deploy/deploy.sh`: the only command the deploy key can run
- [x] `deploy/bootstrap-vps.sh`: one-time setup of a fresh Ubuntu VPS
- [x] `deploy.yml` rewritten: GHCR + SSH, same trigger, queue and `/health` check
- [x] Tests: compose invariants, deploy script refuses anything but a SHA
- [x] Docs: deploy guide, docker guide, configuration reference
- [ ] On the VPS: bootstrap from scratch, first deploy, merge that deploys by itself
- [ ] Production URL in `README.md`

## Decisions taken along the way

- **Basic auth on the proxy until G8-1.** `.agents/rules/security.md` forbids
  exposing the service without authentication, and G8-1 is not done. `/health`
  stays open so the deploy job can check the SHA. The Caddyfile fails to load
  if the hash is empty, so the proxy cannot come up open by mistake.
- **`deploy.sh` is installed as a root-owned copy, not run from the checkout.**
  The forced command points at `/usr/local/bin/codeexpert-deploy`. A commit on
  `main` can change the Compose file, but not what the deploy key is allowed to
  execute. Changing `deploy.sh` needs a person to rerun the bootstrap.
- **The VPS fetches the Compose files with `git`, at the deployed SHA**, and
  refuses a SHA that is not an ancestor of `origin/main`. The repository is
  public, so the VPS needs no GitHub credential.
- **The database URL is a secret file**, `codeexpert_database_url`, like the LLM
  key. Postgres reads its own copy of the password, owned by uid 999.

## Verification

- `make check` (2026-11-16): all checks pass, including the new
  `tests/unit/test_deploy_config.py` (Compose invariants, Caddy protects all
  but `/health`, `deploy.sh` exits 2 on anything but a 40-char SHA).
- `bash -n` on both scripts; `deploy.yml` parses as YAML.
- Not run: no Docker, `shellcheck` or `actionlint` on the authoring machine, so
  `docker compose config`, the image build and the scripts themselves are
  untested. They are tested by the first bootstrap on the VPS.
- Open, needs the VPS: bootstrap from scratch, first deploy, a merge that
  deploys by itself, `/health` with the SHA, production URL in `README.md`.
