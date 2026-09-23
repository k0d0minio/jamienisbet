# Project: model-effort-preselect

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/session-launchers/model-effort-preselect.md
- scope: none
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/lib/launchers, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/app/(app)/tickets/page.tsx, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- Repo preselection is byte-identical: `repo=owner%2Fname` on web, literal slash on terminal (breakdown decision 4).
- Nothing lands in a URL until Jamie's hand-tested spike marks it honoured (decision 3); `environment` included.
- Verb pick-ups are never modified — the prompt-line prefix is for prompt bodies only.
- Model names are aliases (`haiku`/`sonnet`/`opus`), never dated IDs.
- No new stub fields; no `biz.*` change; no new env vars.

## Context budget

- within budget — Define read the stub, breakdown, `lib/launchers/*`, the launch wrappers in `lib/tickets.ts` and README § Tickets.
