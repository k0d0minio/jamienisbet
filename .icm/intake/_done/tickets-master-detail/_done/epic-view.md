# Stub: The epic view, with its breakdown

- feature-slug: epic-view
- sequence: 4 of 6
- depends-on: master-detail-shell
- priority: P2
- size: M

## What this is

What the batch sheet used to hold, promoted to a detail view — plus the breakdown the
board has never shown.

- **Read `breakdown.md`.** `lib/tickets.ts` skips it today (`segments[1] ===
  "breakdown.md"` → `continue`). Read it the way ticket bodies are read — by blob SHA
  from the tree the board already fetches, on the month clock, tagged — and attach it to
  the `Batch`. A missing breakdown is `null`, not an error. Triage and Backlog have none.
  No extra tree calls; the cache invariants in the file header hold.
- **The view** (pane on desktop, pushed view on a phone): title; summary line (repo ·
  `N of M` done · open count); `Meter`; the action row — Copy next (split button with
  launchers, as a ticket's), Recut this batch (epics only, `recutLaunches`), Open on
  GitHub; then the stub list (same rows as list level 1, selecting into the ticket
  view); then the breakdown rendered as markdown, its `## Build order` left in.
- On a phone, where list level 1 and the epic view would otherwise be two screens of the
  same stubs, the epic view *is* level 1: the stub list sits in it, and the action row +
  breakdown sit below. Desktop keeps level 1 in the list and the epic view in the pane.

## Prompt

Read `.icm/intake/tickets-master-detail/breakdown.md`, then this stub
(`.icm/intake/tickets-master-detail/epic-view.md`). `master-detail-shell` must be
merged. Then read the header comment and the tree/blob reading code in
`websites/admin-dashboard/lib/tickets.ts`, `components/batch-row.tsx` (what the old
sheet held), and the `design-dna` skill.

Read each epic's `breakdown.md` by blob SHA alongside its stubs (no new tree calls, cache
invariants intact) and build the epic detail view the stub describes: summary, meter,
Copy next / Recut / GitHub, the stub list, the rendered breakdown. On a phone the epic
view doubles as list level 1.

Work on a `claude/` branch, open a PR, let CI verify (never build locally), check the
Vercel preview on phone and desktop. In the same PR, `git mv` this stub to
`.icm/intake/tickets-master-detail/_done/`.
