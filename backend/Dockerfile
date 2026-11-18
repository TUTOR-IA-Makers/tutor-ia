# CodeExpert API image: FastAPI plus gcc, so the pipeline can compile and run the
# generated C solution (see docs/adr/0004). Configuration comes from CODEEXPERT_*
# environment variables at `docker run` time; nothing secret is baked in.
#
# This image is NOT a sandbox: the runner only bounds time and output size.
# Do not expose it to untrusted users or to the public internet.
#
# The SPA is built here too, so one image serves both (G4-1). The build context
# stays backend/; the front-end arrives as a second, named context:
#
#   docker build --build-context frontend=frontend -t codeexpert:dev backend

# ── The front-end build. Only its dist/ reaches the final image: no Node, no
# node_modules, no sources. Version from frontend/.nvmrc.
FROM node:24.21.0-slim AS spa
WORKDIR /spa
COPY --from=frontend package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --from=frontend . .
# Explicit, because Vite lets a frontend/.env override the production default
# and a developer's `mock` would ship fake data. The environment wins over .env.
ENV VITE_PUBLIC_API_MODE=http
RUN npm run build

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# libc6-dev provides the headers; without it even `#include <stdio.h>` fails.
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# The service writes under var/ (relative paths), so the working directory must
# belong to the unprivileged user. Created empty: runtime data never comes from
# the build context (see .dockerignore).
RUN useradd --create-home --uid 1000 app \
    && mkdir -p /app/var \
    && chown -R app:app /app
WORKDIR /app

# pyproject.toml references README.md, so the package build needs it. The build
# context is backend/, so nothing outside it is visible except the `frontend`
# context, which only the spa stage reads.
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install .

# Static files, read-only for `app`: root owns them. The API serves them when
# this variable is set (codeexpert/api/spa.py).
COPY --from=spa /spa/dist ./frontend
ENV CODEEXPERT_FRONTEND_DIR=/app/frontend

USER app

# Matches PORT in codeexpert/__main__.py. Cloud Run must be told to use it.
EXPOSE 8000

# python:slim has no curl; the standard library is enough for a liveness probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"]

CMD ["codeexpert"]
