# Stub: The Inbox badge runs the whole gates read on every screen

- lane: chore
- found-by: release gates-read · 2026-09-25
- complexity: medium

## Problem

The shell's badge (`countInbox` → `countGates` → `loadGates`, from `app/(app)/layout.tsx`) runs
the full gates read on every screen: the roster, the PR GraphQL query, a tree read per roster
repo and a blob per run folder on `main`. On a cold cache it competes with Work's own reads for
the board's 8-permit queue (`MAX_CONCURRENT_REQUESTS` in `lib/tickets.ts`), and after the 10 s
bound in `lib/gates.ts` the abandoned read keeps holding permits.

## Proposed change

Investigate: a lighter badge count (the PR query alone, no trees or blobs), or reading the gates
only on `/inbox` and handing the count to the chrome — while the badge still equals the rows the
Inbox shows.
