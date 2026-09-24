# Project: repo-and-estate-views

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/tickets-master-detail/repo-and-estate-views.md
- scope: none — the epic's breakdown stands in for it: `.icm/intake/tickets-master-detail/breakdown.md` (decision 3)
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/components, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- `lib/tickets.ts` unchanged: cache header, `force-cache`, clocks, concurrency cap, launcher and
  link building, maintenance prompts (spec → Out of scope; breakdown "What was understood").
- No `dynamic = "force-dynamic"` on any route reading the board.
- Read-only board: every control is a selection, a link or a prompt to copy.
- Selection stays URL state via `useBoardParams` — no navigation, no server request per tap
  (`master-detail-shell`).
- Errored repos get a view but no list section, row or chip (D-1).
- UI through the `design-dna` skill and `packages/ui` primitives; no forked tokens.

## Context budget

- Define read `board-pane.tsx`, `board-views.tsx`, `repo-maintenance.tsx`, the board root,
  `page.tsx`, and greps of `lib/tickets.ts` / `board-model.ts`, to find what the shell already
  moved and settle the errored-repo case.
