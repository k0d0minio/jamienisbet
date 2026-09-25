# Project: gates-read

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/gates-read.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/lib/gates.ts (new), websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/lib/inbox.ts, websites/admin-dashboard/lib/inbox-row.ts, websites/admin-dashboard/app/(app)/inbox, websites/admin-dashboard/app/(app)/layout.tsx, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/components/inbox-list.tsx, websites/admin-dashboard/components/inbox-detail.tsx, websites/admin-dashboard/components/inbox-row.tsx, websites/admin-dashboard/README.md
- complexity: complex → model: opus (executor — select-model.sh --stage 03_build)

## Constraints

- Read-only against GitHub: no tick, merge, re-run or comment from the dashboard (D-9).
- The Follow-ups group and its rules, caps and actions are untouched (inbox-rebuild's D-30–D-35).
- The board's caching invariants hold: `force-cache` on every read, no `dynamic = "force-dynamic"`
  on a route that reads the board or the gates, requests through the board's queue
  (`MAX_CONCURRENT_REQUESTS`), failures reported as sentences, never as an empty list.
- The Inbox never waits on GitHub: Follow-ups render from Neon first; the gates group streams.
- Launches go through `lib/launchers` — no new launch target.
- Desk tier only (`packages/ui` desk primitives); the marketing tier is untouched (D-22).

## Context budget

- Read `lib/tickets.ts` (roster, queue, cache clocks), `lib/inbox.ts`, the head of
  `components/inbox-list.tsx`, `.icm/scripts/ci-status.sh`'s signal arithmetic and the design
  canvas's Inbox artboards, to settle the request budget and the kind rules the stub left open.
