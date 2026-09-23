# Project: dashboard-reads-ticket-base

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/ticket-base-branch/dashboard-reads-ticket-base.md
- scope: none (cut from icm-board's `ticket-base-branch` epic; decision D38 in icm-board `.icm/project.md`)
- spec: 02_define/output/spec.md
- touches: websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components, websites/admin-dashboard/README.md
- complexity: standard → model: sonnet (executor — select-model.sh --stage 03_build)

## Constraints

- A repo with no declared UAT branch reads exactly as today — same tree call, same links.
- Fallback on a missing declared branch is never silent (banner line).
- icm-board keeps "commit straight to main" in its prompts (D38 (7)); every other repo points at
  `pr-conventions` → "The ticket PR".
- The board stays read-only; `today.md` stays on icm-board's default branch.

## Context budget

- icm-board cloned read-only to verify D38 is recorded and take its wording (`.icm/project.md`
  D38, `.icm/intake/ticket-base-branch/breakdown.md`) — the stub's blocker named it.
