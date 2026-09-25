# Stub: Work at the desk: views, repos and the ticket list

- feature-slug: work-panes
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: shell-rail-palette
- sequence: 4 of 11
- complexity: high
- recommended-model: opus

## Problem

The board drills repos → epics → tickets one level at a time, so answering "what do I launch next" or "where is client X at" takes several taps and hides the rest of the estate.

## Proposed change

Rebuild Work's left two panes as mockup option A. Pane one: the views — Up next (runnable now across every repo), Today, Running, Blocked, each with a count — then every repo, foldable, listing its epics with `done/total`, and Triage. Pane two: the list for the chosen view or epic — a dot per status, title, priority, and for estate-wide views a mono line `repo / epic · n of m`; a blocked row says why; a running row says what is running. The third pane keeps the current detail views until `work-reader` replaces them. Selection stays in the URL; the board still loads once and filters on the client; keyboard navigation moves across both panes.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] The first pane lists Up next, Today, Running and Blocked with counts, then the repos with their epics.
- [ ] Up next shows only runnable stubs — lowest unmet sequence with its dependencies merged, not blocked, not running — plus open triage stubs, ordered by priority.
- [ ] Choosing an epic lists all its stubs in sequence, done ones dimmed.
- [ ] A deep link restores the view, the epic and the selected ticket.
- [ ] j/k and the arrow keys move the list; enter opens; the existing `?` sheet lists the keys.
- [ ] Four states are designed: content, a quiet estate, loading, and a GitHub read that failed.

## Out of scope (this feature)

- The reader — `work-reader`.
- The phone layout — `work-phone`.

## Notes for Define

D-7, D-12, D-9. Keep the GitHub cache invariants at the top of `lib/tickets.ts` (force-cache, no force-dynamic, the request cap) and `board-model.ts`'s selection model where it still fits. The estate overview, the repo view and maintenance launchers from repo-and-estate-views must still be reachable (the repo header, or the palette).

touches: websites/admin-dashboard/components/tickets-board.tsx, board-model.ts, board-views.tsx, board-ticket-row.tsx, batch-row.tsx, use-board-params.ts, use-board-keys.ts, ticket-look.ts, app/(app)/page.tsx, lib/tickets.ts (list shaping only)

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/work-panes.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that shell-rail-palette is merged to `main` first.
Then run `/pipeline new work-panes` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
