# Tasks: repo-and-estate-views

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] Opening a repo from its section header shows, in order: the figures row (Open, Today,
- [ ] The repo view's figures match the repo's list section: Open equals the tickets across its
- [ ] Each maintenance launcher in the repo view copies, and opens in its menu, exactly the
- [ ] With a repo read error present, its row under "Couldn't be read" in the estate overview
- [ ] A cold load of `?r=<errored repo>` restores that view on phone and desktop; the errored
- [ ] A repo that has a section and also appears in `board.errors` shows its error in full in its
- [ ] The estate overview shows, in order: the Today / Blocked / Open figures (filter-aware, zeros
- [ ] The Blocked group lists exactly the tickets the Blocked figure counts for the current repo
- [ ] Tapping a Blocked row selects that ticket (`?t=`): on desktop the pane shows its ticket
- [ ] The list shows no figures, maintenance rows or error group; the not-configured,
- [ ] `lib/tickets.ts` is unchanged, launcher URL shapes are unchanged, no route reading the board
- [ ] The admin-dashboard README's Tickets section describes the repo view's figures and error,
- [ ] The Vercel preview is checked on a phone and a desktop in light and dark mode, including a
- [ ] CI green: Typecheck + lint and Build admin-dashboard.

## Queue

- [x] Model: `RepoFocus`, errored-repo resolution under `?r=`, `repoFigures`, `ticketsInGroup`, `blockedReason` — `components/board-model.ts`
- [x] Server: maintenance launchers for errored repos without a section — `app/(app)/tickets/page.tsx`
- [x] Views: repo view (figures, error, client, maintenance) and overview (Blocked group, tappable error rows) — `components/board-views.tsx`
- [x] Wiring: overview callbacks, repo pane from `RepoFocus` — `components/tickets-board.tsx`
- [x] README Tickets section — `websites/admin-dashboard/README.md`
- [ ] Settle CI, merge `main`, flip ready, settle the full gate
