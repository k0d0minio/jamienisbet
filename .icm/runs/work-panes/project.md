# Project: work-panes

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/work-panes.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/components/tickets-board.tsx, websites/admin-dashboard/components/board-model.ts, websites/admin-dashboard/components/board-views.tsx, websites/admin-dashboard/components/board-ticket-row.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/components/board-pane.tsx, websites/admin-dashboard/components/board-keys-sheet.tsx, websites/admin-dashboard/components/use-board-params.ts, websites/admin-dashboard/components/use-board-keys.ts, websites/admin-dashboard/components/ticket-look.ts, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/(app)/loading.tsx, websites/admin-dashboard/app/(app)/palette-actions.ts, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/README.md
- complexity: complex → model: opus (executor — select-model.sh --stage 03_build)

## Constraints

- <what must stay true while this run is built — from the spec's Out of scope, the `D-n`
  decisions in `decisions.md`, and `_shared/project-rules.md`>

## Context budget

- <what was loaded beyond the stage's Inputs, and why — the stage's overrun note lives here>
