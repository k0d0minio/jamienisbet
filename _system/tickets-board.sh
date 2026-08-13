#!/usr/bin/env bash
# tickets-board.sh — print the estate ticket board (read-only).
#
# Scans every repo's .icm/intake/*.md the same way icm-check.sh discovers repos
# (up to 2 levels below Apps/, sustentus exempt — its .icm/ is authoritative)
# and prints tickets grouped today → in-progress → blocked → ready, then counts.
#
# Usage: _system/tickets-board.sh [--today] [root]
#   --today   print only the Today group (used by the SessionStart hook)
# Exit: 0 (always, unless bad invocation → 2)

set -uo pipefail

TODAY_ONLY=0
APPS_ROOT=""
for arg in "$@"; do
  case "$arg" in
    --today) TODAY_ONLY=1 ;;
    -*) echo "Unknown flag: $arg" >&2; exit 2 ;;
    *) APPS_ROOT="$arg" ;;
  esac
done
[[ -n "$APPS_ROOT" ]] || APPS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ -d "$APPS_ROOT" ]] || { echo "Not a directory: $APPS_ROOT" >&2; exit 2; }

EXEMPT=("sustentus")

bold=$'\033[1m'; dim=$'\033[2m'; off=$'\033[0m'
[[ -t 1 ]] || { bold=; dim=; off=; }

mapfile -t repos < <(
  find "$APPS_ROOT" -mindepth 2 -maxdepth 3 -name .git \
    \( -type d -o -type f \) \
    -not -path '*/node_modules/*' \
    -not -path '*/.*/.*/.git' \
    -printf '%h\n' | sort
)
# The root repo (jamienisbet, .git at the root) carries the JN-* tickets.
[[ -e "$APPS_ROOT/.git" ]] && repos=("$APPS_ROOT" "${repos[@]}")

# One line per ticket: status|prio|repo|id|title  (status normalized, prio P0<P1<P2<P9)
rows=""
n_open=0; n_repos=0; n_today=0; n_prog=0; n_blocked=0; n_done=0

for repo in "${repos[@]}"; do
  base="$(basename "$repo")"
  skip=0
  for e in "${EXEMPT[@]}"; do [[ "$base" == "$e" ]] && skip=1; done
  (( skip )) && continue

  intake="$repo/.icm/intake"
  [[ -d "$intake" ]] || continue
  name="${repo#"$APPS_ROOT"/}"
  [[ "$repo" == "$APPS_ROOT" ]] && name="jamienisbet"
  repo_has=0

  for f in "$intake"/*.md; do
    [[ -e "$f" ]] || continue
    fn="$(basename "$f")"
    [[ "${fn,,}" == "readme.md" ]] && continue

    id="$(grep -oE '^[A-Z]+-[0-9]+' <<<"$fn" || true)"
    [[ -n "$id" ]] || id="${fn%.md}"

    title="$(grep -m1 -E '^# ' "$f" | sed -E 's/^# +[^·]+· *//; s/^# +//' || true)"
    [[ -n "$title" ]] || title="${fn%.md}"

    status="$(grep -m1 -iE '^\| *\**status\** *\|' "$f" \
      | sed -E 's/^\|[^|]*\| *([^|]*)\|.*/\1/' | tr -d ' *' | tr '[:upper:]' '[:lower:]' || true)"
    case "$status" in
      today|in-progress|blocked|ready) ;;
      inprogress) status="in-progress" ;;
      *) status="ready" ;;
    esac

    prio="$(grep -m1 -iE '^\| *\**priority\** *\|' "$f" \
      | sed -E 's/^\|[^|]*\| *([^|]*)\|.*/\1/' | grep -oE 'P[0-9]' | head -1 || true)"
    [[ -n "$prio" ]] || prio="P9"

    rows+="$status|$prio|$name|$id|$title"$'\n'
    n_open=$((n_open + 1)); repo_has=1
    case "$status" in
      today) n_today=$((n_today + 1)) ;;
      in-progress) n_prog=$((n_prog + 1)) ;;
      blocked) n_blocked=$((n_blocked + 1)) ;;
    esac
  done

  d="$intake/_done"
  if [[ -d "$d" ]]; then
    c=$(find "$d" -maxdepth 1 -name '*.md' ! -iname 'readme.md' | wc -l)
    n_done=$((n_done + c))
  fi
  (( repo_has )) && n_repos=$((n_repos + 1))
done

print_group() {
  local want="$1" label="$2" out
  out="$(sort -t'|' -k2,2 -k3,3 -k4,4 <<<"$rows" | awk -F'|' -v s="$want" '$1 == s')"
  [[ -n "$out" ]] || return 0
  echo "${bold}${label}${off}"
  while IFS='|' read -r _ prio name id title; do
    p="$prio"; [[ "$p" == "P9" ]] && p="--"
    printf '  %-3s %-28s %-11s %s\n' "$p" "$name" "$id" "$title"
  done <<<"$out"
  echo
}

if (( TODAY_ONLY )); then
  if (( n_today == 0 )); then
    echo "No tickets flagged 'today'. Plan the day with /plan."
  else
    print_group today "Today ($n_today)"
    (( n_today > 3 )) && echo "warn: $n_today tickets flagged today — spec cap is 3 (see _system/PROCESS.md)"
  fi
  echo "RESULT: $n_today today · $n_open open across $n_repos repos"
  exit 0
fi

print_group today       "Today"
print_group in-progress "In progress"
print_group blocked     "Blocked"
print_group ready       "Ready"

echo "RESULT: $n_open open tickets across $n_repos repos ($n_today today, $n_prog in-progress, $n_blocked blocked) · $n_done in _done"
exit 0
