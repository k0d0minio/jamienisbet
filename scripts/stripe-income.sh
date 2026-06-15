#!/usr/bin/env bash
# stripe-income.sh — fetch paid income from Stripe for a period (READ-ONLY).
#
# Contract (ICM script):
#   Inputs:       [--from YYYY-MM-DD] [--to YYYY-MM-DD]   (default: this calendar month)
#   Outputs:      one line per paid invoice + a final `income_eur=<total>` on stdout
#   Side-effects: none — read-only GET to the Stripe API
#   Invocation:   by the agent when finance needs income figures (no --confirm; reads are free)
#
# Requires: curl, jq, STRIPE_SECRET_KEY in .env (or env).
# See _config/conventions/scripts-and-integrations.md. Note: returns up to 100 invoices (no paging).

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
die() { echo "stripe-income: $*" >&2; exit 1; }

FROM="$(date +%Y-%m-01)"; TO="$(date +%F)"
while [ $# -gt 0 ]; do
  case "$1" in
    --from) FROM="${2:-}"; shift 2 ;;
    --to)   TO="${2:-}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown arg: $1" ;;
  esac
done

command -v jq   >/dev/null || die "jq required"
command -v curl >/dev/null || die "curl required"
[ -f .env ] && { set -a; . ./.env; set +a; }
[ -n "${STRIPE_SECRET_KEY:-}" ] || die "STRIPE_SECRET_KEY not set (.env)"

GTE="$(date -d "$FROM" +%s)"; LTE="$(date -d "$TO 23:59:59" +%s)"
RESP="$(curl -sS -G "https://api.stripe.com/v1/invoices" \
  -u "${STRIPE_SECRET_KEY}:" \
  -d status=paid -d limit=100 \
  --data-urlencode "created[gte]=${GTE}" \
  --data-urlencode "created[lte]=${LTE}")"
echo "$RESP" | jq -e '.data' >/dev/null 2>&1 || die "Stripe error: $RESP"

echo "Paid invoices ${FROM}..${TO}:"
echo "$RESP" | jq -r '.data[] | "  \(.number // .id)  \(.customer_name // "?")  €\((.amount_paid/100))"'
echo "income_eur=$(echo "$RESP" | jq '([.data[].amount_paid] | add // 0) / 100')"
