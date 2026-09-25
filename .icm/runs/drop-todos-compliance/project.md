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

- Rows are dropped as they are — no export, no backup step (Define decision, Jamie 2026-09-25).
- No Neon branch and no local `db:migrate`: `database.isolation: none`; CI validates, `main` applies
  (Define decision). The migration is generated with `db:generate`, never hand-written.
- Only todos and compliance go [D-16]; every other feed section, the Leads list and Money are
  untouched (later stubs of `admin-cockpit-redesign`).

## Context budget

- Define: targeted greps of the admin pages and `schema/index.ts` to confirm `touches:`; `.icm/project.json` and `_shared/project-rules.md` (migrations, database isolation) to settle the migration-proof criterion.
