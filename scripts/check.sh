#!/usr/bin/env bash
# The gate. One command, identical for every person and every agent, and the
# same one CI runs. If this passes locally it passes in CI; if it fails, the
# work is not ready for review — no exceptions and no agent-specific variants.
#
#   ./scripts/check.sh           full run
#   ./scripts/check.sh --fast    skip the documentation build
set -euo pipefail

cd "$(dirname "$0")/.."

FAST=0
[[ "${1:-}" == "--fast" ]] && FAST=1

PY="python3"
[[ -x .venv/bin/python ]] && PY=".venv/bin/python"

failures=()
step() {
  local name="$1"; shift
  printf '\n\033[1m▸ %s\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32m  ✓ %s\033[0m\n' "$name"
  else
    printf '\033[31m  ✗ %s\033[0m\n' "$name"
    failures+=("$name")
  fi
}

# ── 1. Nothing that should never be committed ────────────────────────────────
guard_artifacts() {
  local tracked
  tracked=$(git ls-files -- 'var/*' 'cache/*' 'Questions/*' '.env' 'config/LLM_Config.txt' 2>/dev/null || true)
  if [[ -n "$tracked" ]]; then
    echo "Runtime artefacts or secrets are tracked by git:"
    echo "$tracked" | sed 's/^/    /'
    echo "  Fix: git rm --cached <file>"
    return 1
  fi
}

guard_secrets() {
  # Deliberately narrow: real provider key shapes, not a generic entropy scan.
  local hits
  hits=$(git grep -nIE '(sk-[A-Za-z0-9]{32,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----)' \
    -- . ':!*.example' ':!scripts/check.sh' 2>/dev/null || true)
  if [[ -n "$hits" ]]; then
    echo "Possible credential committed:"
    echo "$hits" | sed 's/^/    /'
    return 1
  fi
}

# ── 2. Style, correctness, docs ──────────────────────────────────────────────
run_format() { "$PY" -m ruff format --check src tests main.py; }
run_lint()   { "$PY" -m ruff check src tests main.py; }
run_tests()  { "$PY" -m pytest -q; }
run_docs() {
  if ! "$PY" -c "import mkdocs" 2>/dev/null; then
    echo "  mkdocs not installed — skipping (pip install -e '.[docs]')"
    return 0
  fi
  "$PY" -m mkdocs build --strict --quiet
}

step "no runtime artefacts or secrets tracked" guard_artifacts
step "no credentials in the working tree"      guard_secrets
step "formatting"                              run_format
step "lint"                                    run_lint
step "tests"                                   run_tests
[[ $FAST -eq 1 ]] || step "documentation builds in strict mode" run_docs

printf '\n'
if [[ ${#failures[@]} -eq 0 ]]; then
  printf '\033[32m✓ all checks passed\033[0m\n'
  exit 0
fi
printf '\033[31m✗ %d check(s) failed:\033[0m\n' "${#failures[@]}"
printf '    - %s\n' "${failures[@]}"
exit 1
