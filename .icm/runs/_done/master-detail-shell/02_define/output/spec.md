# Spec: Master–detail shell with a drill-level list

- slug: master-detail-shell
- personas: operator
- touches: websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/components, packages/ui/src/components
- complexity: complex

## Problem

Reading a ticket on the Tickets board (`/tickets` in the admin dashboard) is three containers
deep — batch row → detented sheet → stub expanded in place — and the "Now" strip opens the same
content in a different container (`TicketPeek`). Nothing a selection shows has a URL, so a
ticket can't be linked to, the Needs you home can only drop the operator on a filtered board,
and a phone's back gesture leaves the board instead of the ticket. This is stub 2 of the
`tickets-master-detail` epic (breakdown decisions 1, 2, 3, 6 and 8): with the board now held in
client state (`board-client-state`, #157), it rebuilds the board as one master–detail surface —
a list that drills and a pane that swaps instantly — the structure stubs 3–6 fill in, serving
the operator's goal of an estate glance that is instant and one tap from any ticket.

## Proposed change

Presentation and client routing only. `lib/tickets.ts` (link building, launcher URL shapes,
cache clocks), the `readBoard()` payload and the freshness behaviour from stub 1 are untouched.

- **Layout.** From `lg`: a fixed list column (~22–26rem) and a detail pane that scrolls on its
  own; selecting in the list swaps the pane, the list keeps its scroll. Below `lg`: one column;
  a selection that has a view (ticket, epic, repo) is a full-screen pushed view — large title,
  a back affordance, edge-swipe back — and the list's scroll position survives the round trip.
  Built from the app tier's shell and primitives (`AppScreen`, `GroupedSection`, `GroupedRow`,
  view transitions); `packages/ui` is extended only where a primitive is missing (breakdown
  decision 1).
- **List level 0.** The repo chip rail (the client filter from stub 1) on top, and the refresh
  control with its "as of HH:MM" stamp. Then one grouped section per repo, in today's urgency
  order; its header is tappable and selects the **repo**. Rows, in order: each epic, then
  Triage, Backlog, and — new — **In flight**, each shown only when non-empty. An epic / Triage /
  Backlog row shows its title, `N of M` in mono with the thin `Meter` (epics), "Next · <title>",
  today / blocked count dots and the P0 mark, as the batch row does today. The In flight row
  shows the run count and drills like the others (it replaces the Now strip as the home of
  runs, whose tickets have `batch: null`). Breakdown decision 2.
- **List level 1.** Selecting a batch row pushes the list to that batch's tickets — sequence
  (epics), status dot, title, priority — under a back row "‹ <repo>" that returns to level 0.
  In flight lists the repo's runs (title = run slug, stage in the status column). On desktop,
  selecting a batch fills the pane with the **epic view** (placeholder, below); on a phone,
  level 1 opens with an epic summary row (title, `N of M` + `Meter`) that pushes that view
  full-screen, then the ticket rows. Triage, Backlog and In flight drill the same way; their
  pane/summary view is the same placeholder under the batch's own title.
- **Pane contents until stubs 3–5 land.**
  - **Ticket:** the existing `TicketDetail` (body rendered on demand, as stub 1 left it).
  - **Epic (batch) placeholder:** title, `N of M` + `Meter` for epics, and the launchers the
    retired batch sheet carried — Copy next, Recut (epics), GitHub — so no action is lost.
    Stub 4 adds the breakdown.
  - **Repo placeholder:** repo title, the client link, and the repo's existing maintenance
    launchers (today's per-section maintenance rows, moved here as they are). Stub 5 redesigns.
  - **Estate overview** (desktop, nothing selected): today's masthead content moved as it is —
    the Today / Blocked / Open figures (filter-aware as today), read errors
    (`errors`, `rosterError`, `dbError`), Estate check and the board footnote. On a phone the
    same block is the foot of level 0. Stub 5 redesigns.
- **Selection is URL state**, written with the History API through `useBoardParams`, one
  history entry per selection, never a navigation or server request. Exactly one selection key
  is set at a time (setting one clears the others); `?repo=` (the filter) is independent:
  - `?t=<repo-slug>/<ticket.id>` — a ticket, including triage (`triage/<slug>`), legacy (`<ID>`)
    and runs (`runs/<slug>`). Implies list level 1 of the ticket's batch (In flight for a run).
  - `?b=<repo-slug>/<batch-slug>` — a batch (`<epic>`, `triage`, `backlog`, or `runs` for
    In flight). Implies list level 1 of that batch.
  - `?r=<repo-slug>` — a repo. List stays at level 0.
  - None — level 0; the estate overview in the pane on desktop.
  A cold deep link restores filter, list level and pane. A selection that doesn't resolve (the
  ticket or batch no longer exists, including after a refresh) falls back to its batch if that
  still resolves, else to no selection, and the stale key is dropped with `replaceState`. A
  selection in a repo the active filter excludes shows as selected and the filter is dropped
  (URL updated with `replaceState`); tapping a chip that excludes the current selection clears
  the selection. Back/forward step through selections and filters; the phone back affordance
  and edge-swipe are `history.back()` when the previous entry is the board, else a push to the
  parent state.
- **Active row highlighted** in the list for the current selection (and its batch row at
  level 0 when the list is at level 0 on desktop — not reachable otherwise).
- **Swipes kept** on list rows exactly as today: batch row → Copy next / GitHub / Client, with
  swipe-right committing Copy next; ticket row → Copy / GitHub, swipe-right committing Copy.
  The In flight row carries no swipe; run rows carry the ticket-row swipes where the run has a
  pick-up.
- **Retired:** the Now strip, the batch `Sheet` in `batch-row.tsx`, `ticket-peek.tsx`, and the
  in-place expansion in `board-ticket-row.tsx`. Components and exports nothing imports any more
  are deleted.
- **Needs you home** (`app/(app)/page.tsx`, `TodaysTickets`): each row links to
  `/tickets?t=<repo-slug>/<ticket.id>` instead of `/tickets?repo=<slug>`; the section's comment
  and footer copy stop referring to a "now-strip" ("more on the board").
- **`loading.tsx`** redrawn to the new geometry: at `lg`, a list column (chip rail, a section
  header, batch rows) and an empty pane; below `lg`, the list column alone. First load only, as
  today.

Invariants that must survive untouched: `lib/tickets.ts` (cache header, `force-cache`, clocks,
concurrency cap, link and launcher building), no `dynamic = "force-dynamic"` on any route
reading the board, the read-only contract (every control is a link or a prompt to copy), stub
1's refresh / on-return behaviour and "as of" stamp.

## Acceptance criteria

- [ ] At `lg`+ `/tickets` shows a list column and a detail pane; the pane scrolls independently
      and selecting a list row swaps the pane without moving the list's scroll position.
- [ ] Below `lg` the board is one column; selecting a ticket, an epic summary row or a repo
      header pushes a full-screen view with a large title and a back affordance, edge-swipe
      back works, and returning restores the list's scroll position.
- [ ] Level 0 lists, per repo section in the current urgency order, each epic, then Triage,
      Backlog and In flight (each only when non-empty), with title, `N of M` + `Meter` for
      epics, "Next · <title>", today / blocked dots and the P0 mark.
- [ ] Selecting a batch row pushes the list to level 1 with a "‹ <repo>" back row and that
      batch's tickets (sequence, status dot, title, priority); the back row returns to level 0.
- [ ] Every run in flight that the Now strip showed today is reachable from its repo's
      In flight row, and opens its ticket view with the same Copy verb.
- [ ] On desktop, selecting a batch shows the epic placeholder in the pane with Copy next,
      Recut (epics) and GitHub; on a phone, level 1 starts with an epic summary row that pushes
      that view. Every launcher copies/opens exactly what the retired batch sheet's did.
- [ ] Tapping a repo section header selects the repo and shows its placeholder (client link,
      maintenance launchers — the same launch targets as today's maintenance rows).
- [ ] With nothing selected on desktop the pane shows the estate overview: Today / Blocked /
      Open figures (filter-aware), read errors, Estate check and the footnote; on a phone the
      same block sits at the foot of level 0.
- [ ] Each selection writes `?t=` / `?b=` / `?r=` (one at a time) with no server request for the
      page and no skeleton; the active row is highlighted.
- [ ] A cold load of `/tickets?t=<repo>/<id>`, `?b=<repo>/<batch>` or `?r=<repo>` (optionally
      with `?repo=`) restores the list level, pane and filter on phone and desktop.
- [ ] Browser back/forward steps through selections and filters with list, pane and chips
      matching the URL each time.
- [ ] A deep link to a ticket or batch that no longer exists falls back to its batch, else to
      no selection, and the URL drops the stale key; a refresh that removes the selected ticket
      does the same.
- [ ] A selection outside the active repo filter drops the filter; tapping a chip that excludes
      the selection clears the selection.
- [ ] List-row swipes behave as today: batch row → Copy next / GitHub / Client (swipe-right
      commits Copy next); ticket row → Copy / GitHub (swipe-right commits Copy).
- [ ] The Now strip, the batch sheet, `TicketPeek` and the in-place ticket expansion are gone,
      and no file or export is left that nothing imports.
- [ ] Every Needs you "Today's tickets" row opens `/tickets?t=<repo>/<id>` on that ticket
      (runs included); no copy on the home screen mentions a "now-strip".
- [ ] The first visit to `/tickets` shows the redrawn `loading.tsx` (list column + empty pane at
      `lg`, list alone below) and the board replaces it without a layout jump.
- [ ] `lib/tickets.ts` is unchanged, launcher URL shapes are unchanged, no route reading the
      board exports `dynamic = "force-dynamic"`, and stub 1's refresh, on-return re-read and
      "as of" stamp still work with a selection open.
- [ ] The Vercel preview is checked on a phone and a desktop in light and dark mode, including a
      cold deep link.
- [ ] CI green: Typecheck + lint and Build admin-dashboard (and Build portfolio / sellers-site if
      `packages/ui` changed).

## Out of scope

- The redesigned ticket view (stub 3, `ticket-view`) — the pane shows today's `TicketDetail`.
- Reading `breakdown.md` and the real epic view (stub 4, `epic-view`).
- The real repo view and estate overview design (stub 5, `repo-and-estate-views`) — this run
  only moves today's content into their slots.
- Keyboard navigation (stub 6, `keyboard-nav`).
- Search, status or priority facets (breakdown decision 4).
- Any change to `lib/tickets.ts`, `readBoard()`'s payload shape, cache clocks or launcher URLs.

## Open questions

- none — runs' new home (an In flight row per repo, drilling to its runs) and the phone epic
  view (a summary row atop level 1) settled with the operator in Define, 2026-09-24; the URL
  keys (`t` / `b` / `r`), the fallback rules and the placeholders carrying today's content
  (so Recut, maintenance launchers, figures and read errors stay reachable) are Define's
  technical calls.

Context budget: Define read `use-board-params.ts`, parts of `lib/tickets.ts` (board types, run
tickets), `TodaysTickets` and greps of the board components, to settle the runs question and
the URL keys.
