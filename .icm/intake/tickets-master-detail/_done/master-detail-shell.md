# Stub: Master–detail shell with a drill-level list

- feature-slug: master-detail-shell
- sequence: 2 of 6
- depends-on: board-client-state
- priority: P1
- size: L

## What this is

The board's new structure. Presentation and client routing only — it sits on the client
state from stub 1.

- **Layout.** From `lg`: a list column (fixed, ~22–26rem) and a detail pane that scrolls
  on its own; selecting in the list swaps the pane, the list keeps its scroll. Below
  `lg`: one column; the detail is a full-screen pushed view (large title, back
  affordance, edge-swipe back), and the list's scroll position survives the round trip.
  Use the app tier's existing shell/primitives (`AppScreen`, `GroupedSection`,
  `GroupedRow`, view transitions) and extend `packages/ui` only where a primitive is
  missing.
- **List level 0.** The repo chip rail (client filter) on top; then one grouped section
  per repo, its header tappable (→ repo view, stub 5), rows for each epic plus Triage
  and Backlog: title, `N of M` in mono with the thin `Meter`, "Next · <title>", today /
  blocked count dots, P0 mark. Section order stays the current urgency order.
- **List level 1.** Selecting an epic pushes the list to its stubs — sequence, status
  dot, title, priority — under a back row ("‹ <repo>") and opens the epic view in the
  pane (stub 4; a placeholder until then). Triage/Backlog drill the same way.
- **Selection is URL state** — `?t=` for a ticket, an equivalent for an epic or repo —
  so a deep link restores list level, pane and filter. The active row is highlighted.
- **Swipes kept** on list rows exactly as today: epic row → Copy next / GitHub / Client;
  stub row → Copy / GitHub, swipe-right commit copies.
- **Retired:** the "Now" strip, the batch `Sheet` in `batch-row.tsx`, `ticket-peek.tsx`,
  and the in-place expansion in `board-ticket-row.tsx`. Remove what nothing imports.
- **Needs you home** (`app/(app)/page.tsx`, `TodaysTickets`): each row links to that
  ticket's deep link instead of `/tickets?repo=`; the footer copy stops referring to a
  "now-strip".
- `loading.tsx` redrawn to the new geometry (list column + empty pane at `lg`).

The pane's contents until stubs 3–5 land: the existing `TicketDetail` for tickets, a
simple placeholder for epic/repo/overview.

## Prompt

Read `.icm/intake/tickets-master-detail/breakdown.md`, then this stub
(`.icm/intake/tickets-master-detail/master-detail-shell.md`). `board-client-state` must
be merged. Then read `websites/admin-dashboard/app/(app)/tickets/`, the board components
(`batch-row`, `board-ticket-row`, `ticket-peek`, `ticket-detail`, `chip`,
`swipe-row`), `app/(app)/page.tsx` (`TodaysTickets`) and the `design-dna` skill.

Rebuild the Tickets board as master–detail: list column + pane from `lg`, pushed
full-screen detail below it; a list that drills from repos/epics (level 0) to an epic's
stubs (level 1); selection as client-side URL state with working deep links and
back/forward; swipes kept; the Now strip, batch sheet and `TicketPeek` retired; the Needs
you home's ticket rows deep-link to the ticket. Launcher URL shapes and `lib/tickets.ts`
link building are untouched.

Work on a `claude/` branch, open a PR, let CI verify (never build locally), check the
Vercel preview on a phone and a desktop in both colour modes, including a cold deep link.
In the same PR, `git mv` this stub to `.icm/intake/tickets-master-detail/_done/`.
