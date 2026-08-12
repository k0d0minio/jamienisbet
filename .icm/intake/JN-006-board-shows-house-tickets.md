# JN-006 · Tickets board: show the house repo's own JN tickets

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | S |

## Problem

The board's repo roster is derived from `biz.clients.github_repo` (active client rows
only), so `k0d0minio/jamienisbet`'s own `.icm/intake/` tickets — the `JN-*` series,
including this one — never appear on `/tickets`. Since the 2026-08-12 consolidation
this repo is also the estate control layer, so the blind spot covers process work too.
(`lib/onboarding.ts` already hardcodes `k0d0minio/jamienisbet` as the house repo, so
the concept exists.)

## Acceptance

- [ ] `JN-*` tickets appear on `/tickets`, grouped/sorted like any other repo
- [ ] House repo is not attributed to a client (no client link, or a "house" label)
- [ ] No duplicate entry if a client row ever points at the house repo
- [ ] CI green

## Prompt

Make the admin dashboard's tickets board include the house repo. In
`websites/admin-dashboard/lib/tickets.ts`, `loadRepos()` builds the roster from
`listClientRepos()`; add `k0d0minio/jamienisbet` as a constant house entry (deduped if
a client row already carries it, no client attribution). Read
.icm/intake/JN-006-board-shows-house-tickets.md for full context. Open a PR on a
claude/ branch; do not run local checks — CI is the source of truth.
