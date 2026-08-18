# JN-026 · Ticket lint + dormancy marker in ticket-hygiene

| | |
|---|---|
| Status | ready |
| Type | automation |
| Priority | P2 |
| Size | S |

## Problem

Two signal problems in `_system/scripts/ticket-hygiene.sh`:

1. **It validates none of the contract.** Nothing checks the spec's most load-bearing
   rule — that every ticket has a standalone `## Prompt` (the entire pick-up contract) —
   nor a `Priority` row, a well-formed H1, duplicate/reused numbers across `intake/` +
   `_done/`, or `today` flags older than a day.
2. **Known-good noise drowns real findings.** 15 of the current 17 findings are
   `off-ticket` flags on build-once-hand-off client sites the audit already settled as
   fine ("Done — don't re-litigate"). There is no way to mark a repo dormant.

## Build

- Add the five lint checks above to ticket-hygiene.sh (report-only, as ever — "fixing is
  judgment work, /day applies fixes").
- Add a dormancy marker — recommend an empty `.icm/dormant` file in a repo — that
  silences `off-ticket` findings for that repo (lint checks still run). Document the
  marker in `_system/contracts/TICKETS.md`, and drop it into the settled hand-off repos
  as part of this ticket.

## Acceptance

- [ ] A ticket missing `## Prompt` or `Priority`, a malformed H1, a reused number, and a
      stale `today` flag are each reported
- [ ] Dormant repos produce no off-ticket noise; the marker is documented in TICKETS.md
- [ ] Hygiene output on the current estate is mostly signal (spot-check)

## Prompt

Add ticket lint and a dormancy marker to the Apps estate hygiene script. Read
.icm/intake/JN-026-ticket-lint-dormancy.md for full context. Extend
_system/scripts/ticket-hygiene.sh (report-only) with the five contract lint checks, honor
an empty .icm/dormant marker file by suppressing off-ticket findings for that repo,
document the marker in _system/contracts/TICKETS.md, and add the marker to the
build-once-hand-off client repos listed as settled in _system/AUDIT.md. Client repos
live in projects/ on this machine only. Estate script + contract changes go through a PR
on a claude/ branch; the dormant markers are per-client-repo commits. Do not run local
checks — CI is the source of truth.
