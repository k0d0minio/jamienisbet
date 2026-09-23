# Project: launcher-registry

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/session-launchers/launcher-registry.md
- scope: none
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/lib/launchers, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- Every emitted URL byte-identical (breakdown decision 4); repo preselection untouched.
- No component or `app/` file changes; exported names/signatures in `lib/tickets.ts` unchanged.
- `LaunchHint` declared, ignored — model/effort is stub 2, the dropdown is stub 3.
- Never run build/lint/typecheck locally — CI is the source of truth.

## Context budget

- Within budget: the stub, the breakdown, targeted reads of `lib/tickets.ts` (§ Claude deep
  links, § Maintenance launchers), `README.md` § Tickets, and a grep for the export consumers.
