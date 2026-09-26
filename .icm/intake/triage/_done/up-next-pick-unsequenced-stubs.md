# Stub: An epic's Up next pick misorders stubs with no sequence line

- lane: bug
- found-by: release work-panes (code review) · 2026-09-25
- complexity: low
- priority: P2

## Problem

`fetchRepoTickets` in `websites/admin-dashboard/lib/tickets.ts` picks each epic's next stub
(`nextOf`) by comparing `sequence`, treating a missing one as `MAX-1` for the candidate but
`MAX` for the current pick, and never reading the breakdown's `## Build order` place that the
epic's own rows already use. In an epic whose stubs carry no `- sequence:` line, the last stub in
tree order wins, so Up next shows a different stub from the one the epic's list puts first. The
comparison predates work-panes; the build-order fallback is what it lacks.

## Proposed change

Order the candidates by `sequence ?? buildOrder place ?? MAX`, the same key the epic rows sort on,
with one sentinel for "unplaced" on both sides.

## Acceptance criteria (rough)

- [ ] An epic with no `sequence:` lines but a build order puts its build-order first stub in Up next.
- [ ] Sequenced epics pick exactly as before.

## Prompt

Run `/pipeline bug up-next-pick-unsequenced-stubs`. Context: work-panes' Release review.
