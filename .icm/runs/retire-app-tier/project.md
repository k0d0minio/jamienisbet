# Project: retire-app-tier

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/retire-app-tier.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: packages/ui/app.css, packages/ui/tokens/app.css, packages/ui/src/components/app, packages/ui/src/components/desk, packages/ui/src/components/ui/sheet.tsx, packages/ui/src/index.ts, packages/ui/src/lib/utils.ts, packages/ui/package.json, packages/ui/desk.css, packages/ui/tokens/desk.css, packages/ui/BRAND.md, packages/ui/README.md, packages/ui/SKILL.md, .claude/skills/design-dna/SKILL.md, websites/admin-dashboard/app, websites/admin-dashboard/components, websites/admin-dashboard/README.md
- complexity: complex → model: opus (executor — select-model.sh --stage 03_build)

## Constraints

- <what must stay true while this run is built — from the spec's Out of scope, the `D-n`
  decisions in `decisions.md`, and `_shared/project-rules.md`>

## Context budget

- <what was loaded beyond the stage's Inputs, and why — the stage's overrun note lives here>
