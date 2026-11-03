#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node $(cat .nvmrc) (see frontend/README.md)."
  exit 1
fi
if [[ ! -d node_modules ]]; then
  echo "frontend/node_modules missing. Run: make front-install"
  exit 1
fi

failures=()
step() {
  local name="$1"; shift
  printf '\n\033[1m▸ front: %s\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32m  ✓ %s\033[0m\n' "$name"
  else
    printf '\033[31m  ✗ %s\033[0m\n' "$name"
    failures+=("$name")
  fi
}

step "formatting"                   npm run --silent format:check
step "lint"                         npm run --silent lint
step "css lint (tokens only)"       npm run --silent lint:css
step "types"                        npm run --silent typecheck
step "contrast of tokens"           npm run --silent contrast
step "tests with coverage"          npm run --silent test:coverage
step "production build"             npm run --silent build
step "no secrets in bundle"         npm run --silent check:bundle-secrets
step "bundle size budget"           npm run --silent size
step "production dependency audit"  npm run --silent audit:deps

printf '\n'
if [[ ${#failures[@]} -eq 0 ]]; then
  printf '\033[32m✓ front-end checks passed\033[0m\n'
  exit 0
fi
printf '\033[31m✗ %d front-end check(s) failed:\033[0m\n' "${#failures[@]}"
printf '    - %s\n' "${failures[@]}"
exit 1
