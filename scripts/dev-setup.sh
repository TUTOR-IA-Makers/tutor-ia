#!/usr/bin/env bash
# One-time setup. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."

PY="${PYTHON:-python3}"

if [[ ! -d .venv ]]; then
  echo "▸ creating .venv with $("$PY" --version)"
  "$PY" -m venv .venv
fi

.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -e ".[dev,docs]"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "▸ created .env from .env.example — put your API key in it"
fi

command -v gcc >/dev/null || echo "⚠ gcc not found: test-case generation will fail (tests skip)"

echo "✓ ready. Next: ./scripts/check.sh"
