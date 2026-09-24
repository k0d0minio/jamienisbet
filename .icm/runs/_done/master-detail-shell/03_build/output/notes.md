# Build notes: master-detail-shell

- commits: b2733cc feat: master-detail-shell — the Tickets board as a list that drills and a pane that swaps
- ci: GREEN on f7d2fe0 (full gate — Typecheck + lint, three builds, Vercel previews for jamie-nisbet and portfolio)

## What changed

- `components/use-board-params.ts`: the board's one URL writer — `repo` filter plus exactly one
  selection key (`t` / `b` / `r`, and `pane=1` riding a batch on a phone). `navigate` pushes,
  `correct` rewrites the current entry, `back(parent)` is `history.back()` when the entry was
  pushed from exactly that parent (recorded in `history.state.jnBoardPrev`), else a push of it.
  Only our key goes into `history.state`: the App Router copies its internals into the object
  and syncs `useSearchParams` — handing it `history.state` back would make it skip the sync.
- `components/board-model.ts`: pure — `listSections` (server sections + an In flight batch per
  repo with runs, run-only repos as their own section, urgency order), `resolveSelection`
  (ticket → its batch → none fallback, returned as a `correction` query), `boardFigures`.
- `components/board-pane.tsx`: one element, two readings by CSS only — from `lg` a sticky pane
  under the title bar with its own scroll; below it a fixed pushed view (material back bar,
  16px edge-swipe strip, slide-in via `@starting-style`, page scroll locked while pushed,
  touch events stopped from reaching pull-to-refresh).
- `components/board-views.tsx`: TicketView (existing `TicketDetail` in a slab), BatchView (Copy
  next / Recut / GitHub — the retired sheet's actions), RepoView (client link + maintenance),
  EstateOverview (figures, read errors, Estate check + footnote — moved from the masthead/top).
- `components/tickets-board.tsx`: level 0 (chip rail, repo sections with tappable headers, batch
  rows, overview at the foot on a phone) / level 1 (back row, phone summary row, ticket rows);
  resolves the selection from the URL each render and corrects stale/conflicting URLs with
  `replaceState`; saves level 0's scroll and restores it on return.
- `components/batch-row.tsx`, `board-ticket-row.tsx`: sheet and in-place expansion removed; a
  tap selects; swipes unchanged; active-row fill; In flight row has no gestures; run rows show
  their stage in the priority column.
- `components/repo-maintenance.tsx`: an inline group (was a sheet behind a row).
- `components/ticket-peek.tsx`: deleted.
- `app/(app)/tickets/page.tsx`: masthead figures removed (they live in the overview); builds
  maintenance launchers for run-only repos. `loading.tsx` redrawn (list column + empty pane).
- `app/(app)/page.tsx`: Today's tickets rows → `/tickets?t=<repo>/<id>`; "now-strip" copy gone.

## Acceptance criteria status

- [x] At `lg`+ list column + pane; pane scrolls independently; list scroll untouched on select —
      sticky pane with its own `overflow-y-auto`, the list scrolls with the page.
- [x] Below `lg` one column; ticket / epic summary row / repo header push a full-screen view with
      large title and back bar; edge-swipe back; list scroll held (list stays mounted, page
      scroll locked under the view).
- [x] Level 0 per repo in urgency order: epics, Triage, Backlog, In flight (non-empty only), with
      title, `N of M` + Meter, "Next · …", dots, P0.
- [x] Batch row → level 1 with "‹ <repo>" back row and tickets (sequence, dot, title, priority).
- [x] Runs reachable from In flight → ticket view with the same Copy verb (`TicketDetail`).
- [x] Desktop: batch → BatchView in pane (Copy next / Recut / GitHub); phone: summary row pushes it.
- [x] Repo header → RepoView (client link, maintenance launchers — same `LaunchSet`s).
- [x] Nothing selected (desktop) → overview in pane; phone → overview at the foot of level 0.
- [x] Selections write `t` / `b` / `r` via the History API; active row highlighted.
- [x] Cold load of `t` / `b` / `r` (+ `repo`) restores level, pane, filter — derived from the URL.
- [x] Back/forward — every selection and filter change is its own history entry.
- [x] Stale deep link / refresh-removed ticket → batch, else none, URL corrected with `replaceState`.
- [x] Selection outside the filter drops the filter; a chip excluding the selection clears it.
- [x] Swipes as today (unchanged `SwipeRow` actions and commits).
- [x] Now strip, batch sheet, `TicketPeek`, in-place expansion gone; no orphaned export.
- [x] Needs you rows → `/tickets?t=<repo>/<id>` (runs included); no "now-strip" copy.
- [x] `loading.tsx` redrawn (list column + empty pane at `lg`, list alone below).
- [x] `lib/tickets.ts` unchanged; launcher URL shapes unchanged; no `force-dynamic`; refresh /
      on-return / as-of untouched (`BoardRefresh` unchanged, selection lives in the URL).
- [ ] Preview checked on phone + desktop, light + dark, cold deep link — the operator's smoke.
- [x] CI green — full gate on f7d2fe0.

## Notes for Release

- D-5 is a spec gap: the phone's pushed epic view needed a URL; `?b=…&pane=1` carries it.
- Look closely at `DetailPane`'s class list: the phone (`fixed`) and desktop (`lg:sticky`)
  readings share one element; `lg:top-[calc(...)]` assumes the title bar is the only sticky
  chrome above the pane.
- The edge-swipe back is a 16px strip on the pushed view's leading edge; in mobile Safari (not
  the installed PWA) the browser's own edge swipe takes precedence and does `history.back()`,
  which closes the view the same way.
- `lib/launchers/index.ts` still mentions "a batch sheet" in a comment — outside this spec's
  `touches:`, left as is.

## Release

- gate: Ready to merge ticked — merge authorised
- ci: GREEN on ae15d56 before the reviews; re-read after the last push (see the stop report)
- reviews: code high — 10 findings: 5 fixed in 408ce5a (rotation-safe scroll lock, In flight
  today/blocked dots with the server's urgency order kept, edge strip starts under the back bar,
  pane content keyed per selection, dead `BatchRow.active` removed); 2 parked; 3 declined as
  nits (the ticket row's hairline differs from the batch row's by design — its padding does not
  grow at `md`; the correction's JSON round-trip is a stable effect dependency; `parent: {}` is
  the type's required field) · security security-check.sh --branch --audit: OK · /security-review
  n/a (no auth, payments, PII or route policy touched) · /production-readiness n/a (no DB, auth,
  payments or env var touched) · readiness env.sh audit --changed: OK
- parked: board-runs-slug-collides-with-epic.md, board-sections-for-run-only-repos-server-side.md
- migrations: skip — none of this run's own
- learned: 2 rule(s) from FAILURE.md, appended by close-out.sh (retrospective.sh: skip — no error.log)
- docs: websites/admin-dashboard/README.md § Tickets, § Today's tickets and the components map
  updated · announce: internal
