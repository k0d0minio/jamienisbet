# Project: keyboard-nav

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/tickets-master-detail/keyboard-nav.md
- scope: none (the epic has no scope.md — its breakdown, `intake/tickets-master-detail/breakdown.md`, is the scope of record)
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/components, websites/admin-dashboard/app/(app)/tickets
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- `lg`+ only; below `lg` the board is byte-for-byte the same behaviour (spec → Out of scope).
- The URL is the committed selection only — the level-0 preview never writes it; arrow steps at
  level 1 replace, commits push (settled with the operator in Define, 2026-09-24).
- Every URL key and fallback, deep links, back/forward, the refresh and on-return re-read, and the
  read-only contract survive untouched; `lib/tickets.ts` is not touched.
- The breakdown's decisions 1 (every selection has a URL, changed client-side) and 8 (keyboard
  navigation on desktop is kept) are the ones this run implements.

## Context budget

- Beyond Define's Inputs: read `components/tickets-board.tsx`, `use-board-params.ts`, the head of
  `board-model.ts` and `BatchActions` in `board-views.tsx` to settle the level-0 / history /
  filter behaviour the stub left open.
