# Tasks: master-detail-shell

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] At `lg`+ `/tickets` shows a list column and a detail pane; the pane scrolls independently
- [ ] Below `lg` the board is one column; selecting a ticket, an epic summary row or a repo
- [ ] Level 0 lists, per repo section in the current urgency order, each epic, then Triage,
- [ ] Selecting a batch row pushes the list to level 1 with a "‹ <repo>" back row and that
- [ ] Every run in flight that the Now strip showed today is reachable from its repo's
- [ ] On desktop, selecting a batch shows the epic placeholder in the pane with Copy next,
- [ ] Tapping a repo section header selects the repo and shows its placeholder (client link,
- [ ] With nothing selected on desktop the pane shows the estate overview: Today / Blocked /
- [ ] Each selection writes `?t=` / `?b=` / `?r=` (one at a time) with no server request for the
- [ ] A cold load of `/tickets?t=<repo>/<id>`, `?b=<repo>/<batch>` or `?r=<repo>` (optionally
- [ ] Browser back/forward steps through selections and filters with list, pane and chips
- [ ] A deep link to a ticket or batch that no longer exists falls back to its batch, else to
- [ ] A selection outside the active repo filter drops the filter; tapping a chip that excludes
- [ ] List-row swipes behave as today: batch row → Copy next / GitHub / Client (swipe-right
- [ ] The Now strip, the batch sheet, `TicketPeek` and the in-place ticket expansion are gone,
- [ ] Every Needs you "Today's tickets" row opens `/tickets?t=<repo>/<id>` on that ticket
- [ ] The first visit to `/tickets` shows the redrawn `loading.tsx` (list column + empty pane at
- [ ] `lib/tickets.ts` is unchanged, launcher URL shapes are unchanged, no route reading the
- [ ] The Vercel preview is checked on a phone and a desktop in light and dark mode, including a
- [ ] CI green: Typecheck + lint and Build admin-dashboard (and Build portfolio / sellers-site if

## Queue

- [ ] <task — small enough for one commit; name the file or area>
