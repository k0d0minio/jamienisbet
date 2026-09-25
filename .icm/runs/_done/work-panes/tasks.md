# Tasks: work-panes

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [x] From 1024px wide, Work shows three panes beside the rail — views and repos, the list, the detail — each scrolling on its own; below 1024px the current drill board works as before.
- [x] Pane one lists Up next, Today, Running and Blocked with counts, then every repo (foldable, with its open count) listing its epics with `done/total`, Triage with its count, and Backlog where legacy tickets exist; fold state survives a reload in the same browser.
- [x] Up next lists, per epic, only its lowest open unblocked stub whose every `depends-on` is merged (in `_done/` with no active run), plus every open triage stub, ordered P0, P1, P2, none; a later-sequence stub whose dependencies are merged does not appear while a lower-sequence open stub exists in its epic.
- [x] Running lists every active run folder with its stub's title, `repo / epic · n of m`, and what is running (Build next, Release next, or the lane's merge).
- [x] Blocked lists stubs with a `blocked:` line and each epic's lowest open stub with an unmet dependency, each row saying why ("Waiting on <dep> — running" when the dependency has an active run).
- [x] An estate-view row shows a status dot, the title, the priority when present, and the mono `repo / epic · n of m` line.
- [x] Choosing an epic lists every stub in sequence — open, running and done — with done ones dimmed, titles for `_done/` stubs taken from the breakdown's build order, and no `_done/` blob fetched.
- [x] Selecting a repo's slug lists its open tickets and runs in pane two and its repo view (figures, error, client, maintenance launchers) in pane three; the estate overview shows in pane three for a view with no ticket selected.
- [x] A deep link restores the view or epic or repo and the selected ticket (`?v=`/`?b=`/`?r=` plus `?t=`); `?t=` alone, `?b=<repo>/_runs` and `?repo=` resolve as specified, and back/forward step through lists and selections without a reload.
- [x] `j`/`k` and the arrows move the cursor in the focused pane, Enter opens and moves focus right, Esc moves focus left, `[`/`]` step pane one's entries, `c`/`o`/`r` still work, and the `?` sheet lists every key.
- [x] Each of the four states is drawn: content, a quiet view or estate (the lines in §7), a three-pane loading skeleton, and a failed GitHub read (per repo, roster, no token) that never shows as zero work.
- [x] No new GitHub request per board read: `lib/tickets.ts` keeps `force-cache` on every read, no route reading the board exports `force-dynamic`, and `MAX_CONCURRENT_REQUESTS` still caps them.

## Queue

- [x] `lib/tickets.ts` — `TicketStatus`, merged-dependency rule, one Up next per epic, `_done/` names from the tree, build-order titles, epic rows, today order; palette dots by status (5ec6cc7)
- [x] `components/work-model.ts` + `use-board-params.ts` — the desk's list/ticket URL model, view lists, pane rows, pane-one entries (2ed4d52)
- [x] `components/work-desk.tsx`, `work-screen.tsx`, `use-desk.ts`, `page.tsx` — the three panes from `lg`, the phone board under it (2ed4d52)
- [x] keyboard — focused-pane model, `[`/`]` over views and epics, keys sheet rewritten; phone board's keys off (2ed4d52)
- [x] states — quiet lines, three-pane loading skeleton, failed repo / roster / no token on the desk tier; README Work section (2ed4d52)
- [x] Up next leaves legacy tickets in their Backlog (this commit)
