# Project: launcher-dropdown

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/session-launchers/launcher-dropdown.md
- scope: none
- spec: 02_define/output/spec.md
- touches: packages/ui/src/components/app, packages/ui/src/index.ts, packages/ui/BRAND.md, websites/admin-dashboard/lib/launchers, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/components/board-ticket-row.tsx, websites/admin-dashboard/components/repo-maintenance.tsx, websites/admin-dashboard/app/(app)/tickets/page.tsx, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- Default-target URLs byte-identical to today's (breakdown decisions 4 and 6).
- No component names a launch tool; menus iterate `LAUNCH_TARGETS` only.
- `AppMenu` lives in `packages/ui` (operator's call, 2026-09-23) — no menu primitive in the app.
- List-row launchers (triage, sweep, recut, estate check) get the menu too (operator's call).

## Context budget

- Define read `lib/launchers/*`, the launch parts of `lib/tickets.ts`, `ticket-detail.tsx`,
  the tickets page and `BRAND.md` § AppSelect to confirm the consumers and that no menu
  primitive exists.
