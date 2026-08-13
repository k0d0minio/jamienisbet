#!/usr/bin/env bash
# ticket-hygiene.sh — report ticket drift across the estate (read-only, never fixes).
#
# For every repo with .icm/intake/ (sustentus exempt), reports:
#   possibly-done   open ticket whose ID appears in commits on the default branch
#   today-dilution  more than 3 tickets flagged `today` (spec cap, estate-wide)
#   off-ticket      repo committed to in the last 14 days but has zero open tickets
#   no-status       count of open tickets with no Status row (spec: means `ready`)
#
# Fixing is judgment work — the /groom command applies fixes, this script never does.
#
# Usage: _system/ticket-hygiene.sh [root]
# Exit:  0 clean · 1 findings · 2 bad invocation

set -uo pipefail

APPS_ROOT="${1:-}"
[[ -n "$APPS_ROOT" ]] || APPS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ -d "$APPS_ROOT" ]] || { echo "Not a directory: $APPS_ROOT" >&2; exit 2; }

EXEMPT=("sustentus")

bold=$'\033[1m'; yellow=$'\033[33m'; green=$'\033[32m'; dim=$'\033[2m'; off=$'\033[0m'
[[ -t 1 ]] || { bold=; yellow=; green=; dim=; off=; }

mapfile -t repos < <(
  find "$APPS_ROOT" -mindepth 2 -maxdepth 3 -name .git \
    \( -type d -o -type f \) \
    -not -path '*/node_modules/*' \
    -not -path '*/.*/.*/.git' \
    -printf '%h\n' | sort
)
# The root repo (jamienisbet, .git at the root) carries the JN-* tickets.
[[ -e "$APPS_ROOT/.git" ]] && repos=("$APPS_ROOT" "${repos[@]}")

findings=0
total_today=0

for repo in "${repos[@]}"; do
  base="$(basename "$repo")"
  skip=0
  for e in "${EXEMPT[@]}"; do [[ "$base" == "$e" ]] && skip=1; done
  (( skip )) && continue

  intake="$repo/.icm/intake"
  [[ -d "$intake" ]] || continue
  name="${repo#"$APPS_ROOT"/}"
  [[ "$repo" == "$APPS_ROOT" ]] && name="jamienisbet"

  issues=()
  open_ids=()
  today_n=0
  nostatus_n=0

  for f in "$intake"/*.md; do
    [[ -e "$f" ]] || continue
    fn="$(basename "$f")"
    [[ "${fn,,}" == "readme.md" ]] && continue
    id="$(grep -oE '^[A-Z]+-[0-9]+' <<<"$fn" || true)"
    [[ -n "$id" ]] && open_ids+=("$id")
    if grep -qiE '^\| *\**status\** *\| *today' "$f"; then
      today_n=$((today_n + 1))
    fi
    grep -qiE '^\| *\**status\** *\|' "$f" || nostatus_n=$((nostatus_n + 1))
  done
  total_today=$((total_today + today_n))

  # possibly-done: open ticket IDs referenced by commits already on the default branch
  if (( ${#open_ids[@]} > 0 )); then
    log="$(git -C "$repo" log --oneline -300 2>/dev/null || true)"
    for id in "${open_ids[@]}"; do
      if grep -qF "$id" <<<"$log"; then
        issues+=("possibly-done: $id appears in merged commits but the ticket is still open")
      fi
    done
  fi

  (( today_n > 3 )) && issues+=("today-dilution: $today_n tickets flagged today (cap is 3 estate-wide)")

  # off-ticket work: recent commits, zero open tickets
  if (( ${#open_ids[@]} == 0 )); then
    last="$(git -C "$repo" log -1 --format=%ct 2>/dev/null || echo 0)"
    now="$(date +%s)"
    if (( last > 0 && (now - last) < 14 * 86400 )); then
      issues+=("off-ticket: commits in the last 14 days but no open tickets — work is invisible to the board")
    fi
  fi

  (( nostatus_n > 0 )) && issues+=("no-status: $nostatus_n open tickets have no Status row (reads as ready)")

  if (( ${#issues[@]} == 0 )); then
    echo "${green}ok${off}   ${dim}$name${off}"
  else
    echo "${yellow}drift${off} ${bold}$name${off}"
    for i in "${issues[@]}"; do echo "       $i"; findings=$((findings + 1)); done
  fi
done

echo
(( total_today > 3 )) && { echo "${yellow}estate-wide: $total_today tickets flagged today — cap is 3 total${off}"; findings=$((findings + 1)); }
echo "RESULT: $findings findings$( (( findings == 0 )) && echo ' — clean')"
(( findings == 0 ))
