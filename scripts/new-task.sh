#!/usr/bin/env bash
# Start a task: one branch, one task file, both named after the same issue.
#
#   ./scripts/new-task.sh feat 42 scope-check
#
# Types: feat fix docs refactor chore test
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ $# -lt 3 ]]; then
  sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi

type="$1"; issue="$2"; slug="$3"

case "$type" in
  feat|fix|docs|refactor|chore|test) ;;
  *) echo "Unknown type '$type'. Use: feat fix docs refactor chore test"; exit 1 ;;
esac
[[ "$issue" =~ ^[0-9]+$ ]] || { echo "Issue must be a number (the GitHub issue)."; exit 1; }
[[ "$slug" =~ ^[a-z0-9-]+$ ]] || { echo "Slug must be lowercase-with-dashes."; exit 1; }

branch="${type}/${issue}-${slug}"
task_file=".agents/tasks/${issue}-${slug}.md"

title=""
if command -v gh >/dev/null 2>&1; then
  title=$(gh issue view "$issue" --json title --jq .title 2>/dev/null || true)
fi
[[ -n "$title" ]] || title="TODO — copy the issue title here"

git switch main >/dev/null 2>&1 || git switch -c main
git pull --ff-only >/dev/null 2>&1 || echo "⚠ could not fast-forward main; continuing on the local one"
git switch -c "$branch"

sed -e "s|{{ISSUE}}|${issue}|g" \
    -e "s|{{TITLE}}|${title}|g" \
    -e "s|{{BRANCH}}|${branch}|g" \
    -e "s|{{DATE}}|$(date -u +%Y-%m-%d)|g" \
    .agents/tasks/TEMPLATE.md > "$task_file"

echo "✓ branch  $branch"
echo "✓ task    $task_file"
echo
echo "Next: fill in the task file, then point your agent at AGENTS.md and that file."
