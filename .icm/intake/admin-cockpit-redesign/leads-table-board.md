# Stub: Leads as a table and a deal-stage board

- feature-slug: leads-table-board
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: shell-rail-palette
- sequence: 9 of 11
- complexity: medium
- recommended-model: sonnet

## Problem

At the desk the leads list is phone rows stretched wide: nothing lines up, nothing sorts, and there is no view of the pipeline by stage.

## Proposed change

Rebuild `/leads` in the desk tier. At the desk, a table: name and company, status, deal stage, value, next step, due, last worked, tier, and three row actions (WhatsApp, email, touched). Click a header to sort; the default stays longest-waiting first. Filters All / Open / Clients / Not won with counts; Prospects and Archived as views; the "nothing planned" and "gone quiet" filters from the feed; Add lead. The header carries the cash totals (in play, per month, in kind). A second view, **Board**, shows one column per deal stage 01–08 plus "no folder", read-only, each card with name, value, next step and due. On the phone, the list stays rows with swipe gestures, restyled to the desk tier.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] At the desk the leads list is a table with the nine columns above, sortable by each.
- [ ] Table / Board switches the view and the choice is kept in the URL.
- [ ] The board groups leads by the stage their icm-board deal folder shows; leads with no folder sit in "no folder"; cards cannot be dragged.
- [ ] The prospects and archived views and the two crack filters still work.
- [ ] On the phone rows keep their swipe gestures and non-gesture twins.
- [ ] Totals stay cash-only, as today.

## Out of scope (this feature)

- Changing a stage from the board (D-19).
- The lead profile — `lead-profile-columns`.

## Notes for Define

D-19, D-18. Deal stages come from `dealStages()` in `lib/deals.ts`.

touches: websites/admin-dashboard/app/(app)/leads/page.tsx, components/lead-row.tsx, client-status-select.tsx, deal-stage-chip.tsx, deal-badges.tsx, client-create-form.tsx, components/leads-table.tsx (new), components/deal-board.tsx (new)

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/leads-table-board.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that shell-rail-palette is merged to `main` first.
Then run `/pipeline new leads-table-board` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
