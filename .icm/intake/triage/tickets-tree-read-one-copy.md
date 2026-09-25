# Stub: One tree read in lib/tickets.ts, not two

- lane: chore
- found-by: release gates-read · 2026-09-25
- complexity: low

## Problem

`readRepoTree` (added for the Inbox's gates) repeats the tree fetch and status handling that
`fetchRepoTickets` does inline in `websites/admin-dashboard/lib/tickets.ts`, and the copies have
already drifted: on a 404 the board explains the token can't see the repo, the gates note says
only "GitHub returned HTTP 404".

## Proposed change

Have `fetchRepoTickets` call `readRepoTree`, and move the 404 explanation into it so both
screens say the same thing.
