# Tasks: master-detail-shell

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [x] At `lg`+ `/tickets` shows a list column and a detail pane; the pane scrolls independently
- [x] Below `lg` the board is one column; selecting a ticket, an epic summary row or a repo
- [x] Level 0 lists, per repo section in the current urgency order, each epic, then Triage,
- [x] Selecting a batch row pushes the list to level 1 with a "‹ <repo>" back row and that
- [x] Every run in flight that the Now strip showed today is reachable from its repo's
- [x] On desktop, selecting a batch shows the epic placeholder in the pane with Copy next,
- [x] Tapping a repo section header selects the repo and shows its placeholder (client link,
- [x] With nothing selected on desktop the pane shows the estate overview: Today / Blocked /
- [x] Each selection writes `?t=` / `?b=` / `?r=` (one at a time) with no server request for the
- [x] A cold load of `/tickets?t=<repo>/<id>`, `?b=<repo>/<batch>` or `?r=<repo>` (optionally
- [x] Browser back/forward steps through selections and filters with list, pane and chips
- [x] A deep link to a ticket or batch that no longer exists falls back to its batch, else to
- [x] A selection outside the active repo filter drops the filter; tapping a chip that excludes
- [x] List-row swipes behave as today: batch row → Copy next / GitHub / Client (swipe-right
- [x] The Now strip, the batch sheet, `TicketPeek` and the in-place ticket expansion are gone,
- [x] Every Needs you "Today's tickets" row opens `/tickets?t=<repo>/<id>` on that ticket
- [x] The first visit to `/tickets` shows the redrawn `loading.tsx` (list column + empty pane at
- [x] `lib/tickets.ts` is unchanged, launcher URL shapes are unchanged, no route reading the
- [ ] The Vercel preview is checked on a phone and a desktop in light and dark mode, including a
- [x] CI green: Typecheck + lint and Build admin-dashboard (and Build portfolio / sellers-site if

## Queue

- [x] Selection model + URL keys — `components/use-board-params.ts`, `components/board-model.ts` (b2733cc)
- [x] The shell — `components/board-pane.tsx` (pane from `lg`, pushed view below it) (b2733cc)
- [x] The drill list — `components/tickets-board.tsx`, `batch-row.tsx`, `board-ticket-row.tsx` (b2733cc)
- [x] Pane views — `components/board-views.tsx`, `repo-maintenance.tsx` inline (b2733cc)
- [x] Retire + home + skeleton — `ticket-peek.tsx` deleted, `app/(app)/page.tsx`, `tickets/loading.tsx` (b2733cc)
- [x] Draft-tier CI green, then flip ready and settle the full gate (GREEN on f7d2fe0)
- [ ] Preview walk (operator smoke): phone + desktop, light + dark, cold deep links
