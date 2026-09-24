# Chore: tickets-board-reads-main

- invariant: behaviour unchanged — every repo was already reading `HEAD` (no repo ever declared
  `uat.branch`); only the dead per-repo probe, the caveat that could never fire, and the stale
  D38 copy are removed.
- change: `websites/admin-dashboard/lib/tickets.ts`: dropped `TicketRepo.ticketRef`,
  `TicketFetchError.fallback`, `repoRef()`, `probeTicketRef()`, and the discovery-clock probe
  call — every read and link now addresses `HEAD` directly; `ticketLanding()` returns one
  sentence for every repo (commit straight to `main`, per pr-conventions → Ticket commits).
  `app/(app)/tickets/page.tsx`: dropped the per-repo branch badge and the "Reading from the
  default branch" section (dead — `fallback` never sets). `app/(app)/page.tsx`: dropped the
  matching `fallback` filter on the Needs You feed's unreachable-repo list.
  `README.md`: reworded the Tickets section from D38 (`uat.branch`, ticket base branch, ticket
  PR) to D39 (`main`, straight commit).
- rollback: no schema touched — a plain `git revert` of this PR restores the probe and copy.
- learned: none
