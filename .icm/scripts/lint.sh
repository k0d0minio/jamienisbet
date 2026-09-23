#!/usr/bin/env bash
# lint.sh — lint the files THIS BRANCH changed, and nothing else (PROJECT-OWNED stub).
#
# Same standing as format.sh: changed-files-only FEEDBACK before a push, never the full sweep and
# never the verdict — CI's `Typecheck + lint` is the verdict. Wired here: each website's own
# ESLint (`websites/<app>/eslint.config.mjs`, the binary in that app's node_modules), run inside
# the app over the changed .js/.jsx/.mjs/.ts/.tsx files it owns, no --fix. Errors fail, as
# `pnpm -r lint` does in CI; warnings are printed, not counted. Files outside websites/* are
# reported as skipped — packages/ui's lint is a CSS check, not ESLint.
#
# Usage: .icm/scripts/lint.sh [--base <ref>]     (default base: origin/main)
# Verdict (stdout, last line): RESULT: OK 0 · RESULT: SKIP 0 (not wired) · RESULT: PROBLEMS n
#   exit 2 (the linter reported findings — fix them, or leave them to CI to say the same)
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
die() { echo "error: $*" >&2; exit 1; }

base="origin/main"
while [ $# -gt 0 ]; do
  case "$1" in
    --base) base="${2:-}"; shift 2 ;;
    *) die "unknown argument: $1 (usage: lint.sh [--base <ref>])" ;;
  esac
done

# shellcheck source=lib/changed-files.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/changed-files.sh"
fork="$(fork_point "$base")" || exit 1
files="$(changed_files "$fork")"

if [ -z "$files" ]; then
  echo "no changed files since the fork point off $base"
  echo "RESULT: OK"; exit 0
fi
echo "changed files:"; printf '  %s\n' "$files"

# --- this repo's linter: each website's ESLint, over its own changed files ----------------------
mapfile -t lintable < <(printf '%s\n' "$files" | filter_ext js jsx mjs cjs ts tsx)
declare -A app_files=()
skipped=()
for f in "${lintable[@]}"; do
  case "$f" in
    websites/*/*)
      app="websites/$(echo "${f#websites/}" | cut -d/ -f1)"
      if [ -f "$app/eslint.config.mjs" ]; then app_files["$app"]+="${f#"$app"/}"$'\n'; continue; fi ;;
  esac
  skipped+=("$f")
done
[ "${#skipped[@]}" -eq 0 ] || { echo "skipped (no ESLint config owns these):"; printf '  %s\n' "${skipped[@]}"; }
if [ "${#app_files[@]}" -eq 0 ]; then
  echo "no changed files inside a website with an ESLint config"
  echo "RESULT: OK"; exit 0
fi

problems=0
for app in $(printf '%s\n' "${!app_files[@]}" | sort); do
  linter="$repo_root/$app/node_modules/.bin/eslint"
  [ -x "$linter" ] || die "$app/node_modules/.bin/eslint not found — run 'pnpm install' first"
  mapfile -t rel < <(printf '%s' "${app_files[$app]}")
  set +e
  report="$(cd "$app" && "$linter" --format json --no-warn-ignored "${rel[@]}")"
  status=$?
  set -e
  if [ "$status" -ge 2 ] || ! printf '%s' "$report" | jq -e 'type == "array"' >/dev/null 2>&1; then
    die "$app: the linter itself failed (exit $status)"
  fi
  errors="$(printf '%s' "$report" | jq '[.[].errorCount] | add // 0')"
  echo "$app: $errors error(s) in ${#rel[@]} changed file(s)"
  printf '%s' "$report" | jq -r --arg root "$repo_root/" '
    .[] | (.filePath | ltrimstr($root)) as $f | .messages[]
    | "  \($f):\(.line // 0):\(.column // 0)  \(if .severity == 2 then "error" else "warn " end)  \(.ruleId // "-")  \(.message)"'
  problems=$((problems + errors))
done

if [ "$problems" -gt 0 ]; then
  echo "RESULT: PROBLEMS $problems"; exit 2
fi
echo "RESULT: OK"; exit 0
