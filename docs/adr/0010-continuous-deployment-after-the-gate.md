# ADR-0010 — Deploy main to Cloud Run after the gate, with keyless credentials

- **Status** Proposed
- **Date** 2026-10-07
- **Deciders** the team (draft — a person accepts)

## Context

Issue G0-2 asks that every merge to `main` reach Cloud Run without anyone
deploying by hand, and that a red `make check` never deploy. ADR-0008 makes
`scripts/check.sh` the single gate for people, agents and CI, and `ci.yml` runs it
on every push to `main`. ADR-0009 produced the image, listening on port 8000 while
Cloud Run assumes 8080.

`ci.yml` cancels an in-progress run when a newer commit arrives on the same ref.
That is right for a test run and wrong for a deploy stopped half way.

Deploying needs GCP credentials in GitHub Actions. The usual shortcut is a
service account key stored as a repository secret: a long-lived credential that
works from anywhere until someone revokes it.

The service compiles and runs model-generated C with no sandbox (ADR-0004), and
the security rules say not to expose it to the public internet before
authentication exists (G8-1). The issue also asks for a public URL. That tension
is not resolved by this decision.

The package version (`0.2.0`) does not change on each merge, so it cannot show
which commit is serving.

## Decision

- A separate workflow, `deploy.yml`, triggered by `workflow_run` when `CI`
  completes on `main`. The job runs only when that run **succeeded** and came from
  a push, and checks out the exact commit CI verified. The gate is not repeated.
- Its own concurrency group with `cancel-in-progress: false`: a deploy is never
  interrupted. GitHub keeps one pending run per group, so intermediate commits
  are dropped, and a first job skips the run if its commit is no longer the tip
  of `main` once it gets its turn.
- Authentication by Workload Identity Federation. The job requests a GitHub OIDC
  token; GCP accepts it only for `repo:TUTOR-IA-Makers/tutor-ia:environment:production`
  **and** the repository's numeric id, so a repository recreated under the same
  name inherits nothing.
  No key exists. Project, region and identities are repository variables, not
  secrets.
- Build with the repository `Dockerfile`, tag with the commit SHA, push to
  Artifact Registry, deploy with `--port=8000` and
  `CODEEXPERT_COMMIT_SHA=<sha>`, merging into the service's existing variables.
- After deploying, call `GET /health` with an identity token and fail unless it
  reports the deployed commit.
- The workflow never passes `--allow-unauthenticated`. Who may call the service
  is set on the service by a person.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| A `deploy` job inside `ci.yml` with `needs: check` | Simplest link to the gate, but the workflow-level `cancel-in-progress` would cancel a running deploy when the next commit lands. Splitting the concurrency means changing how CI behaves for every PR |
| Run `check.sh` again at the top of `deploy.yml` | Two copies of the gate, exactly what ADR-0008 rules out, and twice the minutes |
| Service account key in a GitHub secret | A long-lived credential usable from anywhere. Federation gives a short-lived one bound to this repository and environment |
| `gcloud run deploy --source .` (Cloud Build) | Builds remotely with a different path from `docker build` locally; the point of ADR-0009 is one image everywhere |
| Tag images `latest` | Cannot tell which commit a revision runs, and a rollback has nothing to point at |
| Read `$PORT` in `__main__.py` | Application change outside this task; `--port=8000` is enough (ADR-0009 lists it as a revisit condition) |

## Consequences

**Good**

- A failed, cancelled or skipped CI run cannot deploy, and the deployed commit is
  the one that was checked.
- `GET /health` tells anyone which commit is live; the workflow itself fails if it
  is not the one just shipped.
- No credential to leak or rotate. Access is revoked by deleting one IAM binding.

**Bad, or costly**

- `workflow_run` only runs the workflow file from the default branch, so
  `deploy.yml` cannot be exercised on a pull request. The first real test is the
  first merge after GCP is configured.
- A one-time GCP setup (APIs, Artifact Registry, service account, pool and
  provider, variables) is done by hand and lives only in `docs/guides/deploy.md`,
  not in code.
- No staging environment: a broken release is found in production. Rollback is
  routing traffic to the previous revision in Cloud Run, by hand.
- The workflow deliberately does not decide whether the service is public, so
  the acceptance criterion of a public URL depends on a separate human decision.
- Images accumulate in Artifact Registry with no cleanup policy.

## Revisit when

Authentication (G8-1) lands and the service can be made public, a staging
environment (G0-7) is added, the infrastructure moves into code (Terraform or
similar), or the entry point starts reading `$PORT`.
