# Tickets master–detail — breakdown

- epic: tickets-master-detail
- cut: 2026-09-24, interrogation of Jamie (three rounds) + a read of the current board
- scope: `websites/admin-dashboard` — `app/(app)/tickets/`, the board components, and
  `lib/tickets.ts` (one new read: `breakdown.md`). The board stays read-only.

## What was understood

- **Every interaction is a server round-trip.** The repo chips are `<Link
  href="/tickets?repo=…">`, so a filter tap is a navigation: `loading.tsx` flashes its
  skeleton, `listBoard()` re-runs (a Neon roster read on every hit, GitHub tree reads
  whenever the 60 s clock has lapsed) and the whole board re-streams. It feels like a
  reload because it is one.
- **The payload is the entire estate, pre-rendered.** `TicketDetail` renders every
  ticket's full markdown on the server — including the ones never opened — and ships it
  again on every navigation.
- **Reading a ticket is three containers deep.** Batch row → detented sheet → stub
  expanded in place, and the "Now" strip opens the same content in a *different*
  container (`TicketPeek`). The ticket itself stacks a split button, a recommendation, a
  "Sends `…`" line, a metadata list and the body — too much, and poor on a phone.
- The manual refresh (`BoardRefresh` → `updateTag` + `router.refresh()`) already exists
  and is the right mechanism for "current right now". The GitHub cache invariants at the
  top of `lib/tickets.ts` (`force-cache`, no `force-dynamic`, 8-request cap) stand.

## Decisions (Jamie's, 2026-09-24)

1. **Master–detail.** Desktop (`lg`+): a list column and a detail pane; selection swaps
   the pane instantly. Phone: one column, the detail is a full-screen pushed view with a
   back gesture. Every selection has a URL (deep-linkable), changed client-side.
2. **The list drills.** Level 0: repo sections, each listing its epics (plus Triage and
   Backlog) as rows — title, `N of M` + `Meter`, next stub, count dots. Selecting an
   epic pushes the list to level 1: that epic's stubs (sequence, status dot, title,
   priority), with a back row to the repos. The batch sheet is retired.
3. **Detail kinds.** The pane shows one of four views: **ticket**, **epic** (breakdown
   rendered, progress, stub list, Copy next / Recut / GitHub), **repo** (client link,
   figures, maintenance launchers — opened by tapping a repo header), and, when nothing
   is selected on desktop, the **estate overview** (the Today / Blocked / Open figures,
   read errors, Estate check, the board footnote). On a phone the estate overview is the
   foot of level 0.
4. **Filtering is repo only**, and client-side — instant, no navigation. No search, no
   status or priority facets.
5. **The ticket view, above the fold on a phone:** title; one summary line (status ·
   priority · `n of m` · repo); the copy split button with the Recommended hint beside
   it; the metadata table. Body below. The "Sends `…`" line is dropped — the button's
   label ("Copy pick-up" / "Copy prompt") already says which.
6. **The Now strip is dropped** from the board. Status dots carry the signal; the Needs
   you home keeps its own "Today's tickets" section, which now deep-links to the ticket.
7. **Freshness: manual + on return.** Loaded once; nothing refetches on interaction. The
   refresh button stays. On returning to the tab/PWA after ≥5 minutes away, the board
   re-reads silently in the background — no skeleton, no layout jump, selection kept. An
   "as of HH:MM" stamp makes staleness visible.
8. **Kept:** swipe gestures on list rows; keyboard navigation on desktop; the
   Recommended hint. `breakdown.md` is now read (by blob SHA — warm reads are free).

## Build order

1. `board-client-state` — the board loads once into client state; repo filter and
   selection are client-side URL state; on-return refresh; "as of" stamp.
2. `master-detail-shell` — the two-column / pushed-view layout, the drill-level list,
   deep links, retirement of the Now strip, batch sheet and `TicketPeek`.
3. `ticket-view` — the redesigned ticket detail, phone-first.
4. `epic-view` — `breakdown.md` read + the epic detail view.
5. `repo-and-estate-views` — the repo view and the estate overview (figures, errors,
   Estate check).
6. `keyboard-nav` — desktop keyboard navigation across list and pane.

1 makes it fast; 2 makes it navigable and is the riskiest change (layout + routing), so
it lands on a proven data layer. 3–5 fill the pane and are independent of each other
once 2 is in. 6 last, when every view it moves between exists.
