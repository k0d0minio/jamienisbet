#!/usr/bin/env bash
# stripe-receivables.sh — outstanding (open) + overdue invoices from Stripe (READ-ONLY).
#
# NOTE: superseded for daily use by the admin dashboard (/finances and /today,
# which auto-paginate past Stripe's 100-item page cap). Kept as a local
# read-only utility for ad-hoc terminal checks.
#
# Contract (ICM script):
#   Inputs:       none
#   Outputs:      one line per open invoice (overdue flagged) + `open_eur=` and `overdue_eur=`
#   Side-effects: none — read-only GET
#   Invocation:   by the agent for receivables / the overdue-receivables metric / the invoice chaser
#
# Requires: curl, jq, STRIPE_SECRET_KEY in .env. Up to 100 invoices (no paging).

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
die() { echo "stripe-receivables: $*" >&2; exit 1; }

command -v jq   >/dev/null || die "jq required"
command -v curl >/dev/null || die "curl required"
[ -f .env ] && { set -a; . ./.env; set +a; }
[ -n "${STRIPE_SECRET_KEY:-}" ] || die "STRIPE_SECRET_KEY not set (.env)"

NOW="$(date +%s)"
RESP="$(curl -sS -G "https://api.stripe.com/v1/invoices" -u "${STRIPE_SECRET_KEY}:" -d status=open -d limit=100)"
echo "$RESP" | jq -e '.data' >/dev/null 2>&1 || die "Stripe error: $RESP"

echo "Open invoices:"
echo "$RESP" | jq -r --argjson now "$NOW" '
  .data[] | "  \(.number // .id)  \(.customer_name // "?")  €\((.amount_due/100))  due:\(if .due_date then (.due_date|todate|.[0:10]) else "—" end)\(if (.due_date and .due_date < $now) then "  OVERDUE" else "" end)"'
echo "open_eur=$(echo "$RESP" | jq '([.data[].amount_due] | add // 0) / 100')"
echo "overdue_eur=$(echo "$RESP" | jq --argjson now "$NOW" '([.data[] | select(.due_date and .due_date < $now) | .amount_due] | add // 0) / 100')"
