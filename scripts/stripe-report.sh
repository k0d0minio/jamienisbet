#!/usr/bin/env bash
# stripe-report.sh — period finance summary from Stripe (READ-ONLY): income, receivables, tax reserve.
#
# NOTE: superseded for daily use by the admin dashboard (/finances and /today,
# which auto-paginate past Stripe's 100-item page cap). Kept as a local
# read-only utility for ad-hoc terminal checks.
#
# Contract (ICM script):
#   Inputs:       [--from YYYY-MM-DD] [--to YYYY-MM-DD]  (default: this month)  [--reserve PCT]
#   Outputs:      a markdown summary on stdout (income, open/overdue, suggested reserve)
#   Side-effects: none — composes stripe-income.sh + stripe-receivables.sh (both read-only)
#   Invocation:   by the agent for the monthly review / the dashboard
#
# Reserve rate: pass --reserve from workspaces/finance/setup/output/config.md
# (flat 30%) — confirm with the contabilista. Omit it and reserve is left blank.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
S="$ROOT/scripts"

FROM=""; TO=""; RESERVE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --from) FROM="${2:-}"; shift 2 ;;
    --to)   TO="${2:-}"; shift 2 ;;
    --reserve) RESERVE="${2:-}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "stripe-report: unknown arg: $1" >&2; exit 1 ;;
  esac
done

INCARGS=(); [ -n "$FROM" ] && INCARGS+=(--from "$FROM"); [ -n "$TO" ] && INCARGS+=(--to "$TO")
INC="$(bash "$S/stripe-income.sh" "${INCARGS[@]}")"
REC="$(bash "$S/stripe-receivables.sh")"
income="$(printf '%s\n' "$INC" | sed -n 's/^income_eur=//p')"
open="$(printf '%s\n' "$REC" | sed -n 's/^open_eur=//p')"
overdue="$(printf '%s\n' "$REC" | sed -n 's/^overdue_eur=//p')"

echo "# Finance summary (${FROM:-this month}..${TO:-today})"
echo "- Income (paid): €${income:-0}"
echo "- Open receivables: €${open:-0}  (overdue: €${overdue:-0})"
if [ -n "$RESERVE" ]; then
  reserve="$(awk "BEGIN{printf \"%.2f\", ${income:-0} * ${RESERVE} / 100}")"
  echo "- Tax reserve @ ${RESERVE}%: €${reserve}"
else
  echo "- Tax reserve: pass --reserve <pct> (finance/setup/config.md; flat 30%; confirm with contabilista)"
fi
echo
echo "> Read-only from Stripe; figures are decision-support — confirm with the contabilista."
