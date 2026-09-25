# Project: work-reader

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/work-reader.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/board-pane.tsx, websites/admin-dashboard/components/board-views.tsx, websites/admin-dashboard/components/launch-menu.tsx, websites/admin-dashboard/components/markdown.tsx, websites/admin-dashboard/components/work-desk.tsx, websites/admin-dashboard/components/work-model.ts, websites/admin-dashboard/components/use-board-keys.ts, websites/admin-dashboard/components/board-keys-sheet.tsx, websites/admin-dashboard/components/ticket-look.ts, websites/admin-dashboard/app/globals.css, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/lib/launchers/index.ts, websites/admin-dashboard/README.md
- complexity: complex → model: opus (executor — select-model.sh --stage 03_build)

## Constraints

- Tickets stay read-only; nothing is stored when Launch is pressed (D-9, D-11).
- `lib/launchers/` is the only place a link is built; no new target, no model/effort in a link
  no target documents (D-10).
- Every new GitHub read goes through the board's cache path (force-cache, revalidate, 8-in-flight
  cap) — never a live `cache: "no-store"` read.
- Desk tier only in the reader; the phone board under `lg` is `work-phone`'s (D-3, D-4, D-7).
- The Inbox's PR listing is `gates-read`'s — this run matches PRs to stubs and nothing more.

## Context budget

- Define read `lib/tickets.ts`, `lib/launchers/*`, `components/ticket-detail.tsx`, parts of
  `work-desk.tsx`, `new-run.sh` and `project-labels.sh` (to settle the lane-PR match and the
  launch-link question), and the round-2 mockup artboard `WorkThreePane.dc.html`.
