# Project: drop-todos-compliance

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/drop-todos-compliance.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: packages/services/src/schema/index.ts, packages/services/src/queries/tasks.ts, packages/services/src/queries/compliance.ts, packages/services/src/index.ts, packages/services/drizzle, packages/services/README.md, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/(app)/leads/[id]/page.tsx, websites/admin-dashboard/app/(app)/leads/page.tsx, websites/admin-dashboard/components/overdue-list.tsx, websites/admin-dashboard/components/add-todo.tsx, websites/admin-dashboard/components/compliance-calendar.tsx, websites/admin-dashboard/components/lead-todos.tsx, websites/admin-dashboard/README.md, AGENTS.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- <what must stay true while this run is built — from the spec's Out of scope, the `D-n`
  decisions in `decisions.md`, and `_shared/project-rules.md`>

## Context budget

- <what was loaded beyond the stage's Inputs, and why — the stage's overrun note lives here>
