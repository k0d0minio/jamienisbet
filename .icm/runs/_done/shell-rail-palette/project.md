# Project: shell-rail-palette

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/shell-rail-palette.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/app/(app)/layout.tsx, websites/admin-dashboard/app/layout.tsx, websites/admin-dashboard/app/globals.css, websites/admin-dashboard/components/nav.tsx, websites/admin-dashboard/components/app-screen.tsx, websites/admin-dashboard/components/app-menu.tsx, websites/admin-dashboard/components/command-palette.tsx, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/(app)/loading.tsx, websites/admin-dashboard/app/(app)/inbox, websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/lib, websites/admin-dashboard/README.md
- complexity: complex → model: opus (executor — select-model.sh --stage 03_build)

## Constraints

- Screens inside the shell keep their app-tier content; only the chrome moves to the desk tier (spec Out of scope).
- Money stays routable by URL and out of the rail, tab bar and palette (D-17, D-24).
- Tickets stay read-only; palette actions only open launch links (D-9).
- The board's GitHub cache rules hold: no `force-dynamic`, no uncached read (header of `lib/tickets.ts`).
- The marketing sites are untouched (D-22).

## Context budget

- Read the design canvas's Main, WorkThreePane and WorkPhone artboards (the stub cites them) and the desk-tier spec to pin the primitives and the rail layout.
