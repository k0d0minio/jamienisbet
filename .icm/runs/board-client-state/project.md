# Project: board-client-state

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/tickets-master-detail/board-client-state.md
- scope: none
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/components, websites/admin-dashboard/lib/tickets.ts
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- `lib/tickets.ts` cache invariants: `force-cache` on every GitHub read, the concurrency cap,
  no `dynamic = "force-dynamic"` on any route reading the board.
- Read-only board; launcher URL shapes unchanged.
- Visual layout unchanged — stub 2 (`master-detail-shell`) redesigns it; `?t=` is read/written
  by the URL hook but wired to no UI this run.
- As-of stamp = server `listBoard()` return time, Europe/Lisbon (operator, Define 2026-09-24).
- Epic context: `.icm/intake/tickets-master-detail/breakdown.md` (decisions 4, 7).

## Context budget

- Define read `app/(app)/tickets/*`, `components/board-refresh.tsx`, `markdown.tsx`, the head of
  `ticket-detail.tsx` and parts of `lib/tickets.ts` beyond targeted greps, to pin which pieces
  are `server-only` (launch sets must be precomputed) and how the refresh works today.
