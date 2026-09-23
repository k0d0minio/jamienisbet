# Tasks: dashboard-reads-ticket-base

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] On a repo whose `project.json` declares `uat.branch: "uat"` (berceo), the board shows the `uat` branch's intake and runs: a stub moved to `_done/` on `uat` but still open on `main` is not on the board
- [ ] A repo with no `project.json`, no `uat` block, or `uat.branch: ""` reads exactly as today (tree at the default branch, same links, no badge, no banner line)
- [ ] Every "Open on GitHub" link for a ticket, batch folder and run folder on a UAT repo points at `<ref>` (the branch the board read), not `HEAD`
- [ ] A repo whose declared UAT branch does not exist on GitHub still shows its default branch's tickets, and the board's banner names the repo and the missing branch
- [ ] A UAT repo's group header shows a badge naming the branch it was read from; non-UAT repos show none
- [ ] No triage, sweep or recut prompt for a repo other than icm-board contains "commit straight to main"; each names the repo's ticket base branch and the `pr-conventions` ticket PR. icm-board's prompts still say "commit straight to main"
- [ ] The `project.json` read is cached on the discovery clock (one request per repo per hour at most), not per board load
- [ ] `websites/admin-dashboard/README.md` → Tickets describes reading the ticket base branch
- [ ] CI green

## Queue

- [x] Ticket ref per repo — `probeTicketRef` + `TicketRepo.ticketRef`, set in `loadRoster()` (lib/tickets.ts)
- [x] Tree read, blob/tree/run links at `repoRef(repo)`; declared-branch 404 → default branch + `fallback` banner entry (lib/tickets.ts)
- [x] Branch badge on the repo group header; board footnote (app/(app)/tickets/page.tsx)
- [x] Home feed keeps fallback repos out of "Couldn't read" (app/(app)/page.tsx)
- [x] Triage/sweep/recut prompts land a D38 ticket PR; icm-board unchanged (`ticketLanding`, lib/tickets.ts)
- [x] README → Tickets (websites/admin-dashboard/README.md)
