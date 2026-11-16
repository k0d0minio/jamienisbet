#!/usr/bin/env bash
# ci-status.sh — one read of the checks of one pull request.
#
# Usage: ci-status.sh <pull request number> [--watch]
#
# The script reads the head commit of the pull request. It prints one line for each check,
# then one verdict. It reads the check runs and the commit statuses.
#
#   --watch  reads again each 15 seconds while a check is pending or no check is listed,
#            30 minutes at most. The wait is in the script and costs no model turn.
#
#   --all    counts icm-gate too. release.sh uses it before the merge.
#
# Without --all the check icm-gate is not counted: it waits for the operator's tick.
# Last line: RESULT: GREEN (exit 0) | RESULT: RED (exit 1) | RESULT: PENDING (exit 8).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$here/lib/project.sh"
. "$here/lib/gh.sh"

number="" watch=0 skip=$'^icm-gate\t'
for a in "$@"; do
  case "$a" in
    --watch) watch=1 ;;
    --all) skip=$'^\t' ;;
    '' | *[!0-9]*) stop "usage: ci-status.sh <pull request number> [--watch]" ;;
    *) number="$a" ;;
  esac
done
[ -n "$number" ] || stop "usage: ci-status.sh <pull request number> [--watch]"
need git gh jq
cd "$(icm_root)"

deadline=$((SECONDS + 1800))
while :; do
  sha="$(gh_pr "$number" | jq -r '.head.sha')" || stop "the pull request #$number was not read"
  checks="$(gh_checks "$sha" | grep -v "$skip" || true)"
  waiting=0
  if [ -z "$checks" ] || printf '%s\n' "$checks" | cut -f2 | grep -qx pending; then
    waiting=1
  fi
  if [ "$watch" -eq 0 ] || [ "$waiting" -eq 0 ] || [ "$SECONDS" -ge "$deadline" ]; then
    break
  fi
  sleep 15
done

echo "#${number} at ${sha:0:7}"
[ -z "$checks" ] || printf '%s\n' "$checks" | sort
if [ -z "$checks" ]; then
  echo "RESULT: PENDING no check is listed"
  exit 8
fi
if printf '%s\n' "$checks" | cut -f2 | grep -qvxE 'ok|pending'; then
  echo "RESULT: RED"
  exit 1
fi
if printf '%s\n' "$checks" | cut -f2 | grep -qx pending; then
  echo "RESULT: PENDING"
  exit 8
fi
echo "RESULT: GREEN"
