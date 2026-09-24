# Project: epic-view

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/tickets-master-detail/epic-view.md
- scope: none (epic cut from `.icm/intake/tickets-master-detail/breakdown.md` directly)
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- `lib/tickets.ts` cache rules hold: every read via `gh()`/`fetchBlob` (force-cache, board tag,
  concurrency cap), breakdowns by blob SHA on the month clock, no `force-dynamic` on a board route.
- Read-only board; launcher URL shapes and prompts unchanged.
- Epic-view stub scope only — ticket view, repo/estate views and keyboard nav are other stubs.
- Breakdown decisions 3 and 8 (`.icm/intake/tickets-master-detail/breakdown.md`) are the source.

## Context budget

- Define read `use-board-params.ts`, `board-views.tsx`, `tickets-board.tsx` (level 1, pane
  wiring), the `Batch` type / tree walk / batch assembly in `lib/tickets.ts`, and the shipped
  `master-detail-shell` spec, to reconcile the stub's phone layout with the shell's interim
  summary row.
