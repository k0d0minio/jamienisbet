# Tasks: epic-view

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] For every epic with an open stub and a `breakdown.md` on the default branch, the epic view
- [ ] The breakdown is read by blob SHA through `fetchBlob` from the tree the board already
- [ ] An epic with no `breakdown.md` (or whose breakdown blob read fails) renders its view with
- [ ] At `lg`+ selecting a batch fills the pane with, in order: title, summary line
- [ ] Copy next is the same split button a ticket carries: it copies exactly the next ticket's
- [ ] Recut this batch appears on epics only and copies/opens what it does today; Open on GitHub
- [ ] Tapping a stub in the view's list selects that ticket (`?t=`) and shows the ticket view,
- [ ] Below `lg`, `?b=<repo>/<batch>` shows level 1 as: back row, title, summary line, `Meter`,
- [ ] A cold load of `/tickets?b=<repo>/<batch>&pane=1` opens that level 1 and the URL loses
- [ ] Back from a ticket opened from phone level 1 returns to that level 1 with its scroll
- [ ] `lib/tickets.ts` still carries no `dynamic = "force-dynamic"` on any board route, every new
- [ ] The Vercel preview is checked on a phone and a desktop in light and dark mode, on an epic
- [ ] CI green: Typecheck + lint and Build admin-dashboard.

## Queue

- [ ] <task — small enough for one commit; name the file or area>
