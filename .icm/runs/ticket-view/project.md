# Project: ticket-view

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/tickets-master-detail/ticket-view.md
- scope: none
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/components, websites/admin-dashboard/app/globals.css
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- The board stays read-only and loaded once: no new server read, no change to `lib/tickets.ts`
  parsing or grouping (spec → Out of scope).
- Selection is client-side URL state through `useBoardParams()` — a dependency link never
  triggers a navigation round-trip (breakdown decision 1).
- Brand from `packages/ui` only; the per-turn UI checklist is the `design-dna` skill.
- Epic, repo and overview views, and keyboard nav, belong to later stubs of this epic.

## Context budget

- Read `components/board-views.tsx`, the ticket case of `components/tickets-board.tsx`, the
  `Ticket` type and stub parsing in `lib/tickets.ts`, and `components/ticket-look.ts` beyond
  Define's Inputs — to place the summary line and confirm how blocked reasons reach `meta`.
