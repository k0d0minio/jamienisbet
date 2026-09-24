# Project: master-detail-shell

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/tickets-master-detail/master-detail-shell.md
- scope: none
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/components, packages/ui/src/components
- complexity: complex → model: opus (executor — select-model.sh --stage 03_build)

## Constraints

- `lib/tickets.ts` untouched: cache header, `force-cache`, clocks, concurrency cap, link and
  launcher building; `readBoard()`'s payload shape unchanged.
- No `dynamic = "force-dynamic"` on any route reading the board; the board stays read-only.
- Stub 1's refresh, on-return re-read and "as of" stamp keep working with a selection open.
- Selection is URL state only (`t` / `b` / `r`, one at a time; `repo` independent), written by
  `useBoardParams` via the History API — never a `<Link>` navigation on the board.
- Pane contents are placeholders carrying today's content; stubs 3–5 own their redesign.
- Breakdown decisions: `.icm/intake/tickets-master-detail/breakdown.md` (1, 2, 3, 6, 8).

## Context budget

- Define: `use-board-params.ts`, parts of `lib/tickets.ts` (board types, run tickets),
  `TodaysTickets` and greps of the board components — to settle runs' new home and the URL
  keys.
