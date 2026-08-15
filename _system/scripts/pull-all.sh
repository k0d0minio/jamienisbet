#!/usr/bin/env bash
# pull-all.sh — run `git pull --ff-only` across every repo in the Apps estate.
#
# Discovers the root repo (jamienisbet, .git at the Apps root) plus git repos up
# to 2 levels below Apps/ (the client repos in projects/<repo>). Nested repos
# inside an already-found repo are not descended into.
#
# Usage: _system/scripts/pull-all.sh [-n] [root]
#   -n   dry run — report status, pull nothing

set -uo pipefail

APPS_ROOT="${2:-${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}}"
DRY_RUN=0
if [[ "${1:-}" == "-n" ]]; then
  DRY_RUN=1
  APPS_ROOT="${2:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
fi

if [[ ! -d "$APPS_ROOT" ]]; then
  echo "Not a directory: $APPS_ROOT" >&2
  exit 1
fi

bold=$'\033[1m'; red=$'\033[31m'; green=$'\033[32m'; yellow=$'\033[33m'; dim=$'\033[2m'; off=$'\033[0m'
[[ -t 1 ]] || { bold=; red=; green=; yellow=; dim=; off=; }

ok=(); skipped=(); failed=()

# Find repos at depth 1 and 2, ignoring node_modules and dot-dirs.
mapfile -t repos < <(
  find "$APPS_ROOT" -mindepth 2 -maxdepth 3 -name .git \
    \( -type d -o -type f \) \
    -not -path '*/node_modules/*' \
    -not -path '*/.*/.*/.git' \
    -printf '%h\n' | sort
)
# The root repo itself (jamienisbet).
[[ -e "$APPS_ROOT/.git" ]] && repos=("$APPS_ROOT" "${repos[@]}")

if (( ${#repos[@]} == 0 )); then
  echo "No git repositories found under $APPS_ROOT"
  exit 0
fi

echo "${bold}Pulling ${#repos[@]} repositories under $APPS_ROOT${off}"
echo

for repo in "${repos[@]}"; do
  name="${repo#"$APPS_ROOT"/}"
  [[ "$repo" == "$APPS_ROOT" ]] && name="jamienisbet (root)"
  printf '%s%s%s\n' "$bold" "$name" "$off"

  branch=$(git -C "$repo" symbolic-ref --quiet --short HEAD 2>/dev/null || true)
  if [[ -z "$branch" ]]; then
    echo "  ${yellow}skip${off} — detached HEAD"
    skipped+=("$name (detached HEAD)")
    continue
  fi

  if ! git -C "$repo" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' >/dev/null 2>&1; then
    echo "  ${yellow}skip${off} — '$branch' has no upstream"
    skipped+=("$name (no upstream)")
    continue
  fi

  if [[ -n "$(git -C "$repo" status --porcelain)" ]]; then
    echo "  ${yellow}skip${off} — uncommitted changes on '$branch'"
    skipped+=("$name (dirty)")
    continue
  fi

  if (( DRY_RUN )); then
    echo "  ${dim}dry run — would pull '$branch'${off}"
    ok+=("$name")
    continue
  fi

  before=$(git -C "$repo" rev-parse HEAD)
  if out=$(git -C "$repo" pull --ff-only --quiet 2>&1); then
    after=$(git -C "$repo" rev-parse HEAD)
    if [[ "$before" == "$after" ]]; then
      echo "  ${green}up to date${off} ($branch)"
    else
      echo "  ${green}updated${off} ($branch) ${dim}${before:0:7}..${after:0:7}${off}"
      git -C "$repo" --no-pager log --oneline "$before..$after" | sed 's/^/    /'
    fi
    ok+=("$name")
  else
    echo "  ${red}failed${off} ($branch)"
    printf '%s\n' "$out" | sed 's/^/    /'
    failed+=("$name")
  fi
done

echo
echo "${bold}Summary${off}: ${green}${#ok[@]} pulled${off}, ${yellow}${#skipped[@]} skipped${off}, ${red}${#failed[@]} failed${off}"
for s in "${skipped[@]}"; do echo "  ${yellow}skipped${off} $s"; done
for f in "${failed[@]}"; do echo "  ${red}failed${off}  $f"; done

(( ${#failed[@]} == 0 ))
