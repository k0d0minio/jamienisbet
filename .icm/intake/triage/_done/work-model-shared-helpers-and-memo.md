# Stub: Work's desk model repeats helpers and recomputes on every keystroke

- lane: chore
- found-by: release work-panes (code review) · 2026-09-25
- complexity: low
- priority: P2

## Problem

`websites/admin-dashboard/components/work-model.ts` keeps its own copies of `RUNS_SLUG`,
`batchSlugOf` (board-model.ts) and `PRIORITY_RANK`/`rank` (lib/tickets.ts), and
`components/use-desk.ts`'s `DESK_QUERY` repeats `use-board-keys.ts`'s `DESKTOP_QUERY` — copies
that must stay in step by hand. Each `WorkDesk` render (every j/k step rewrites `?t=`) also
rebuilds `locateAll` twice and runs `viewTickets` four or five times over the whole board.
`todayOrder` round-trips its keys through `"slug id"` → `.replace(" ", "/")` instead of being
built as `<repo>/<id>` in `fetchTodayKeys`.

## Proposed change

Export and import the shared helpers from one place; memoize the view lists, `locateAll` and the
nav entries on `board` (and the fold state); build `todayOrder` keys directly. No behaviour change.

## Acceptance criteria (rough)

- [ ] One definition each of the `_runs` slug, the priority rank and the `lg` media query.
- [ ] A j/k step re-derives no view list when only `t` changed.

## Prompt

Run `/pipeline chore work-model-shared-helpers-and-memo`. Context: work-panes' Release review.
