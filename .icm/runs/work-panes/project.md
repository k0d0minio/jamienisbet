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

- Tickets stay read-only (D-9); nothing written to a repo, nothing stored on the server.
- Running comes from run folders only (D-11); no PR read — that is `gates-read`.
- The GitHub cache invariants at the top of `lib/tickets.ts` hold: `force-cache`, no
  `force-dynamic`, `MAX_CONCURRENT_REQUESTS`, `_done/` blobs never fetched, no new request.
- Below `lg` the drill board stays as it is (`work-phone` owns it); pane three keeps today's
  detail views (`work-reader` owns it).
- Desk-tier primitives from `packages/ui` only; brand is one source of truth.

## Context budget

- Define read `lib/tickets.ts`, `board-model.ts` and `use-board-params.ts` headers and the
  canvas artboard `WorkThreePane.dc.html` beyond its Inputs: the status rules and the URL model
  could not be specified without the current shapes.
