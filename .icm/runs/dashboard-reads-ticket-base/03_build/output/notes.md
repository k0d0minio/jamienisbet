# Build notes: dashboard-reads-ticket-base

- commits: feat: dashboard-reads-ticket-base — read each repo's ticket base branch
- ci: pending (cheap tier on the draft head)

## What changed

- `websites/admin-dashboard/lib/tickets.ts`: `TicketRepo.ticketRef` (null = default branch);
  `probeTicketRef` reads `.icm/project.json` → `uat.branch` on the discovery clock (skipped for
  icm-board, D38 exempt); `repoRef()` drives the tree read and every blob/tree/run link; a 404
  at a declared ref re-reads `HEAD` and returns a `fallback: true` error alongside the tickets;
  `ticketLanding()` ends the triage/sweep/recut prompts with the D38 ticket PR line (icm-board
  keeps "commit straight to main").
- `websites/admin-dashboard/app/(app)/tickets/page.tsx`: mono outline pill with the branch on a
  repo's group header when `ticketRef` is set; footnote says where tickets are read from.
- `websites/admin-dashboard/app/(app)/page.tsx`: the Needs-you footnote no longer counts a
  fallback repo as unread.
- `websites/admin-dashboard/README.md` → Tickets: the ticket base branch, the badge, the
  fallback, the prompts.

## Acceptance criteria status

- [x] UAT repo reads `uat`'s intake and runs — tree read at `ticketRef`; to confirm on berceo in the preview
- [x] Non-UAT repo reads as today — `ticketRef` null → `HEAD`, same URLs, no badge, no error entry
- [x] Links on a UAT repo point at the ref — `blobUrl`, run `htmlUrl`, `batchFolderUrl` all use `repoRef`
- [x] Missing declared branch → default branch + named in "Couldn't be read"
- [x] Badge on UAT repo headers only
- [x] Prompts: only icm-board's say "commit straight to main"; others name the base and pr-conventions
- [x] `project.json` read on `DISCOVERY_REVALIDATE_SECONDS` (hourly)
- [x] README → Tickets updated
- [ ] CI green — pending

## Notes for Release

- Smoke on the preview: berceo/agorasim headers carry a `uat` badge and a stub known `_done` on
  `uat` is absent; jamienisbet/icm-board carry none; a triage prompt copied on berceo names `uat`.
- The fallback banner sits under the existing **Couldn't be read** heading (destructive row
  styling) though the repo's tickets are shown — the message says so; worth a look.
- `ticketRef` is set by mutating the per-request roster objects (built fresh in `loadRoster()`
  per `readEstate` call), including the fallback reset in `fetchRepoTickets`.
