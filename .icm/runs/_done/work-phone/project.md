# Project: work-phone

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/work-phone.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/components/work-screen.tsx, websites/admin-dashboard/components/work-model.ts, websites/admin-dashboard/components/use-board-params.ts, websites/admin-dashboard/components/use-desk.ts, websites/admin-dashboard/components/ticket-reader.tsx, websites/admin-dashboard/components/work-views.tsx, websites/admin-dashboard/components/work-desk.tsx, websites/admin-dashboard/components/tickets-board.tsx, websites/admin-dashboard/components/board-pane.tsx, websites/admin-dashboard/components/board-views.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/components/board-ticket-row.tsx, websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/ticket-look.ts, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/globals.css, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- The desk (from `lg`, 1024px) is unchanged: its panes, keyboard map and URL handling — beyond
  reading `?v=repos` as Up next without rewriting it.
- One codepath for data: the phone reads `readBoard()` and resolves through `work-model.ts`
  (`resolveWork`, `viewTickets`, `whereLine`, `rowNote`) — no second selection model, no
  phone-only data shaping in `lib/tickets.ts`.
- Desk tier only (`packages/ui` desk primitives, desk tokens); no app-tier import (`Material`,
  `Grouped*`) in anything Work renders. Deleting the app tier itself is `retire-app-tier`'s.
- Tickets stay read-only; Launch sends and stores nothing (D-9, D-11).
- Flat motion: no spring; no slide under `prefers-reduced-motion` (D-3).
- 44px floor on touch, nothing hover-only (D-3, spec §6).

## Context budget

- Define read the phone mockup (`project/WorkPhone.dc.html` on the design canvas) and targeted
  greps of `components/` to name real `touches:` paths and what the desk still imports from the
  old phone board — beyond the Inputs table, because the stub's `touches:` guess missed the files
  the deletion (spec §7) needs.
