#!/usr/bin/env bash
# session-start.sh — SessionStart hook for Apps-root sessions.
# Prints the Today group of the estate ticket board so every planning/working
# session opens knowing what the day is. Read-only; quiet on failure (a hook
# must never break session start).
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$DIR/scripts/tickets-board.sh" --today 2>/dev/null || true
exit 0
