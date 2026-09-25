# Project: leads-table-board

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/leads-table-board.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/app/(app)/leads/page.tsx, websites/admin-dashboard/app/(app)/leads/loading.tsx, websites/admin-dashboard/components/leads-table.tsx, websites/admin-dashboard/components/deal-board.tsx, websites/admin-dashboard/components/lead-row.tsx, websites/admin-dashboard/components/client-status-select.tsx, websites/admin-dashboard/components/deal-stage-chip.tsx, websites/admin-dashboard/components/deal-badges.tsx, websites/admin-dashboard/components/client-create-form.tsx, websites/admin-dashboard/lib/leads.ts, websites/admin-dashboard/lib/deals.ts, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- Read-only board: no drag, no stage write (D-19, spec Out of scope).
- Totals stay cash-only, computed as today (the `totals()` rule in the page).
- The crack views list exactly what their counts count (`hasNoPlan`, `isIdleDiscussion` mirror `crack-finder.ts`).
- Deal-folder reads keep `lib/deals.ts`'s caching; no `force-dynamic` on the route.
- Every swipe action keeps a non-gesture twin on the profile.
- Desk-tier primitives from `packages/ui` (`DataGrid`, `DeskSegmentedControl`, `DeskButton`); no tokens forked in the app (BRAND.md § Desk tier).

## Context budget

- Define read the design canvas's `LeadsDesk.dc.html` artboard (the column set and board layout) and the retire-app-tier / lead-profile-columns / inbox-rebuild stubs to draw the Out of scope lines.
