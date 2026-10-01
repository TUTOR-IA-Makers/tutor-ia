# CodeExpert API image: FastAPI plus gcc, so the pipeline can compile and run the
# generated C solution (see docs/adr/0004). Configuration comes from CODEEXPERT_*
# environment variables at `docker run` time; nothing secret is baked in.
#
# This image is NOT a sandbox: the runner only bounds time and output size.
# Do not expose it to untrusted users or to the public internet.

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

# pyproject.toml references README.md and LICENSE, so the package build needs
# them. Copying the metadata before src/ keeps the dependency layer cached
# until pyproject.toml changes.
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
RUN pip install .

USER app

# Matches PORT in codeexpert/__main__.py. Cloud Run must be told to use it.
EXPOSE 8000

# python:slim has no curl; the standard library is enough for a liveness probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"]

CMD ["codeexpert"]
