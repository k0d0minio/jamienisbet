# Stub: The Tickets board still carries the ticket-base-branch read D39 retired

- lane: chore
- feature-slug: tickets-board-reads-main
- sequence: found during the D39 template sync (icm-board `one-branch-two-targets/estate-sync-d39`, 2026-09-24)
- priority: P3
- size: S

## What this is

D39 (icm-board `.icm/project.md`) made `main` the one home of ticket state in
every repo and removed `uat.branch` from the pipeline schema — `setup.sh` now fails a repo that
still declares it. The admin dashboard's Tickets board still carries D38's machinery from #150
and #152: `websites/admin-dashboard/lib/tickets.ts` probes `.icm/project.json` → `uat.branch`
for a per-repo ticket ref, keeps a caveat row for a declared branch that is missing, and
`ticketLanding()` tells the reader to "Land ticket-only changes as a ticket PR into <base> …
'The ticket PR'" — a rule and a skill section that no longer exist.

Behaviour is already right by accident: no repo declares `uat.branch`, so every read falls back
to the default branch. What is wrong is the dead probe (one extra read per repo per hour), the
caveat that can never fire, and the landing prompt, which is user-visible and now false.

## Proposed change

- Drop the `uat.branch` probe, `ticketRef` and the missing-branch caveat; every repo reads
  `HEAD` of its default branch, as before #150.
- `ticketLanding()` returns one sentence for every repo: ticket-only changes commit straight to
  `main` (`pr-conventions` → Ticket commits).
- Reword the D38 comments (around `lib/tickets.ts:163`, `:687`, `:1055`, `:1167`, `:1483`), the
  board page copy and `websites/admin-dashboard/README.md` to D39.

## Acceptance criteria (rough)

- [ ] `git grep -n -i 'ticket base\|ticketRef\|uat.branch' websites/` empty
- [ ] The Tickets board lists the same stubs for every repo as before the change
