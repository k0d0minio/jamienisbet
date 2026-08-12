# JN-007 · Tickets board: fix sustentus exclusion + tolerate verbose metadata

| | |
|---|---|
| Status | ready |
| Type | bug |
| Priority | P2 |
| Size | XS |

## Problem

Two small correctness holes in `websites/admin-dashboard/lib/tickets.ts`:

1. `EXCLUDED_REPOS` contains the literal `"sustentus/sustentus"`, but the estate's
   exempt repo is `sustentus-v2` — if a client row ever points at the real full name,
   the exclusion won't fire and the board would misread its `pipeline/` repo.
2. The parser takes `Priority` values verbatim: remi-ai's `P0 — live exposure, close
   today` uppercases to a string that matches no rank, so those tickets sort as
   unprioritized. Similarly, bold metadata keys (`| **Status** |`) don't match the
   plain `status`/`priority` key comparison.

## Acceptance

- [ ] Exclusion matches the actual sustentus repo full name(s)
- [ ] `Priority` extracts a leading `P0`–`P2` from verbose values
- [ ] `**Status**` / `**Priority**` keys (bold, remi-ai style) are recognized
- [ ] CI green

## Prompt

Fix the tickets-board parser in
websites/admin-dashboard/lib/tickets.ts: correct the sustentus entry in
EXCLUDED_REPOS, strip `*` from metadata keys before comparing, and extract a leading
P0/P1/P2 token from Priority values instead of using them verbatim. Read
.icm/intake/JN-007-board-parser-and-exclusion-fixes.md for full context. Open a PR on
a claude/ branch; do not run local checks — CI is the source of truth.
