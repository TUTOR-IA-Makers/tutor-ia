#!/usr/bin/env bash
# Apply everything that can be fixed mechanically, so review is about behaviour.
set -euo pipefail
cd "$(dirname "$0")/.."

PY="python3"
[[ -x backend/.venv/bin/python ]] && PY="$PWD/backend/.venv/bin/python"
cd backend

"$PY" -m ruff check --fix src tests main.py
"$PY" -m ruff format src tests main.py
echo "✓ formatted and auto-fixed — run ./scripts/check.sh next"
