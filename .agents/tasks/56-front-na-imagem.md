# 56 — feat: servir o front-end pela imagem da API no deploy

- **Branch** `feat/56-front-na-imagem`
- **Issue** #56
- **Started** 2026-11-18
- **Driver** Hugo Rosa (with Claude Code)

## Goal

The production URL serves the React SPA, not just the API. The Vite build runs in
a stage of `backend/Dockerfile`, only `dist/` reaches the final image, and FastAPI
serves it from the same origin when `CODEEXPERT_FRONTEND_DIR` is set. This is the
remaining part of G4-1 (#3): one image, one deploy, no CORS, no second domain.

## Out of scope

- Authentication of our own: Caddy's basic auth keeps covering everything but `/health`.
- `deploy/Caddyfile`, `deploy/deploy.sh`, `deploy/compose.yaml` — nothing there changes.
- Custom domain, database backups, the "not yet run on a VPS" status in `deploy.md`.
- The G4-1 stack ADR.

## Constraints

- The API build context stays `backend/`: `tests/unit/test_dockerignore.py`
  forbids `!` re-inclusions and checks `backend/.dockerignore`. The front-end
  enters as a BuildKit named context (`--build-context frontend=frontend`).
- No new Python dependency: Starlette's `FileResponse` is enough.
- Nothing below `api/` imports FastAPI; the setting lives in `settings.py`.
- `.github/workflows/deploy.yml` is CODEOWNERS territory — a human reviews it.

## Plan

- [x] `frontend/.dockerignore` and a `spa` stage in `backend/Dockerfile`
- [x] `frontend_dir` setting; `api/spa.py` serves files and falls back to `index.html`
- [x] `deploy.yml` passes the named context
- [x] Tests: SPA routes, assets, API untouched, `/api/*` 404 in JSON, traversal, misconfiguration
- [x] Docs: docker.md, deploy.md, configuration.md, codebase.md, frontend/README.md, backend/README.md

## Decisions taken along the way

- Served by FastAPI, not by Caddy, because G4-1 and `frontend/README.md` already
  say so and it keeps a single image: no second GHCR package, no `deploy.sh`
  change, no reinstall on the VPS.
- `CODEEXPERT_FRONTEND_DIR` pointing at a directory without `index.html` fails at
  startup instead of serving 404s: the container never turns healthy and the
  deploy stops, which is the loud failure we want.
- `/api/...` paths never fall back to `index.html`, so a typo in a client call
  gets a JSON 404 instead of a page of HTML.
- `VITE_PUBLIC_API_MODE=http` is set in the build stage, so a developer's
  `frontend/.env` with `mock` cannot ship fake data even if the named context
  ignores `.dockerignore`.

## Verification

- `make check`: all checks passed (backend tests, front-end checks, docs strict).
- `docker build --build-context frontend=frontend -t codeexpert:spa-test backend`
  from the repo root: built. The `frontend` context transferred ~1 MB, so
  `frontend/.dockerignore` is honoured (no `node_modules`).
- Container run locally, by hand: turned `healthy`; `/` and `/gerar` → index.html
  with `no-cache`; `/assets/*.js` → `immutable`; `/api/v1/nope` → JSON 404;
  `/api/v1/structures` and `/docs` → 200; the bundle calls `/api/v1` (http mode).
- Image audit: `/app` holds `README.md frontend pyproject.toml src var`; no `.env*`,
  no `node_modules`, no `node`; `/app/frontend` owned by root, mode 755.
- Not verified: the deploy workflow itself (runs only after the merge to main).
