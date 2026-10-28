# ADR-0011 — Host the 30/11 delivery on a Hostinger VPS instead of Cloud Run

- **Status** Proposed — supersedes ADR-0010 once accepted
- **Date** 2026-10-28
- **Deciders** the team (draft — a person accepts)

## Context

ADR-0010 chose Cloud Run and shipped `.github/workflows/deploy.yml` for it. The
GCP project was never configured, so that workflow has never run and there is no
production URL. The team has decided to host on Hostinger instead.

Hostinger sells shared hosting, which cannot run a container or `gcc`, and KVM
virtual servers (VPS) with root access, which can. Only the VPS is an option. A
VPS is one machine we administer: there is no managed Postgres, no secret
manager, no image registry and no request-routed autoscaling. The plan for the
S1 stories (G0-3, G0-4, G1-1) was written assuming all of those existed.

Two facts in the plan change with the host:

- The G0-4 trap — step 2 landing on a different Cloud Run instance and
  answering `404` — does not happen on a single VPS. `var/` on a Docker volume
  survives restarts and redeploys. The reasons to move state into Postgres that
  remain are the library listing (G1-5), job state (G0-8), never showing a
  half-generated question, and having one thing to back up.
- Cloud Run could not cap memory or process count per request. Docker can cap
  them per container (`mem_limit`, `pids_limit`), which does not isolate
  generated code from the API but does stop a fork bomb from taking the whole
  machine down with it.

Not yet verified: the exact plan and datacenter (a Brazilian one is expected),
what Hostinger's snapshot and backup features cover, and whether its own API is
usable for deploys.

## Decision

- **One Hostinger KVM VPS** running Ubuntu and Docker Compose. Plan to be chosen
  with at least 2 vCPU, as G8-3 asks.
- **Compose services:** `api` (the image from ADR-0009), `db` (Postgres 16 with a
  named volume) and `proxy` (Caddy, which obtains and renews the TLS certificate).
  Only the proxy publishes ports, 80 and 443. Postgres and the API are reachable
  only on the Compose network. The firewall allows 22, 80 and 443.
- **Images in GitHub Container Registry**, tagged with the commit SHA. The deploy
  job pushes with the workflow's own `GITHUB_TOKEN`; the VPS pulls. The image
  carries no secret (ADR-0009), so the package may be public, which leaves the
  VPS with no registry credential.
- **Deploy over SSH**, still triggered by a green `CI` on `main` as in ADR-0010
  (`workflow_run`, no cancel-in-progress, skip if not the tip of `main`, check
  `GET /health` reports the SHA). The job runs in the `production` environment,
  restricted to `main`. It holds one SSH key, stored as an environment secret,
  whose `authorized_keys` entry has a forced command that can only run the
  deploy script with a SHA. The host key is pinned in a repository variable.
- **Secrets as files, not environment variables.** The LLM key and the database
  password live on the VPS under a root-owned directory and reach the container
  through Compose `secrets`, mounted under `/run/secrets`. They never pass
  through GitHub. Reading them is G0-3's work.
- **Migrations** run as a one-shot Compose service before `api` starts (G1-1).
- **Backups** are a daily `pg_dump` copied off the VPS, plus a restore tested
  once (G1-1). Hostinger snapshots are an extra, not the backup.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Stay on Cloud Run | The team decided against it. On the merits it gave managed Postgres, a secret manager and keyless deploys, and cost a stateless design (G0-4) before anything else could ship |
| Hostinger shared or cloud hosting | Runs PHP and Node apps, not an arbitrary container with `gcc` |
| Managed Postgres elsewhere (Neon, Supabase) with the API on the VPS | Backups handled for us, but the database crosses the internet on every step, adds a second provider and a second bill, and has free-tier limits to watch. Reasonable if backups on the VPS prove unreliable |
| Hostinger's API or panel to deploy | Ties the pipeline to a vendor API and an account token whose scope is wider than one server (*A confirmar*). SSH with a forced command is narrower and portable |
| Plain `docker run` driven by the workflow | Three containers with a network, volumes and secrets are what Compose describes in one versioned file |
| Secrets as environment variables in a `.env` on the VPS | Simplest, and `Settings` already reads them, but they show in `docker inspect` and `/proc/<pid>/environ` to anyone with Docker access |
| Kubernetes (k3s) on the VPS | One machine and six part-time people. Nothing here needs a scheduler |

## Consequences

**Good**

- `var/` on a volume makes the current code work in production as it is, before
  G0-4 lands, so the S0 goal of a public URL is no longer blocked on Postgres.
- Container-level memory, process and read-only filesystem limits become
  available to G8-3.
- A fixed monthly price instead of per-request billing: no surprise from the
  host, only from the LLM provider.
- The same `docker compose` file can run on a laptop, so production can be
  reproduced locally.

**Bad, or costly**

- We operate the machine: OS updates, Docker updates, disk space, TLS renewal
  failures, log rotation. Nobody is paged when it goes down.
- One VPS is a single point of failure. A disk loss without a working off-site
  dump loses every question a teacher approved.
- No keyless deploy. A long-lived SSH key sits in GitHub; the forced command and
  the `production` environment limit what it can do, and it must be rotated if
  anyone with admin access to the repository leaves.
- Access to the Docker socket is root on the host. Anyone who can run `docker`
  on the VPS can read the secret files.
- `deploy.yml` targets Cloud Run and has to be rewritten. Until then the docs
  describe a workflow that no longer matches the decision.
- No staging and no autoscaling. A slow generation holds a worker on the one
  machine there is.

## Revisit when

A second client or code from students needs real isolation (Judge0 wants its own
VM anyway), the VPS stays above 70% CPU or memory during the pilot, a restore
from backup fails, or nobody on the team is available to patch the machine.
