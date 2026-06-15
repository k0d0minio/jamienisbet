#!/usr/bin/env bash
# send-email.sh — send an email via Resend from a reviewed body file.
#
# Contract (ICM script):
#   Inputs:       --to <addr>  --subject <text>  --body-file <path>  [--from <addr>]  [--confirm]
#   Outputs:      Resend message id on stdout (only when sending)
#   Side-effects: sends an email ONLY when --confirm is passed; otherwise dry-runs (no send)
#   Invocation:   by the agent, after a human has reviewed --body-file
#
# Boundary (see _config/conventions/scripts-and-integrations.md): no outbound action without a
# reviewed file AND --confirm. Without --confirm this prints exactly what it would send and exits.
#
# Requires: bash, curl, jq, and RESEND_API_KEY in .env (or the environment).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FROM="contact@jamienisbet.com"
TO=""
SUBJECT=""
BODY_FILE=""
CONFIRM=0

die() { echo "send-email: $*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --to)         TO="${2:-}"; shift 2 ;;
    --subject)    SUBJECT="${2:-}"; shift 2 ;;
    --body-file)  BODY_FILE="${2:-}"; shift 2 ;;
    --from)       FROM="${2:-}"; shift 2 ;;
    --confirm)    CONFIRM=1; shift ;;
    -h|--help)    grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            die "unknown argument: $1" ;;
  esac
done

[ -n "$TO" ]        || die "missing --to"
[ -n "$SUBJECT" ]   || die "missing --subject"
[ -n "$BODY_FILE" ] || die "missing --body-file (the human-reviewed email body)"
[ -f "$BODY_FILE" ] || die "body file not found: $BODY_FILE (review the draft first)"
command -v jq   >/dev/null 2>&1 || die "jq is required (sudo apt install jq)"
command -v curl >/dev/null 2>&1 || die "curl is required"

BODY="$(cat "$BODY_FILE")"

# Build the JSON payload safely with jq (handles all escaping).
PAYLOAD="$(jq -n \
  --arg from "$FROM" --arg to "$TO" --arg subject "$SUBJECT" --arg text "$BODY" \
  '{from:$from, to:[$to], subject:$subject, text:$text}')"

if [ "$CONFIRM" -ne 1 ]; then
  echo "DRY RUN — not sending (pass --confirm to send). Would POST to Resend:"
  echo "$PAYLOAD" | jq .
  exit 0
fi

# Load secrets only when actually sending.
if [ -f .env ]; then set -a; . ./.env; set +a; fi
[ -n "${RESEND_API_KEY:-}" ] || die "RESEND_API_KEY not set (.env or environment)"

RESP="$(curl -sS -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")"

if echo "$RESP" | jq -e '.id' >/dev/null 2>&1; then
  echo "sent: $(echo "$RESP" | jq -r '.id')"
else
  die "Resend error: $RESP"
fi
