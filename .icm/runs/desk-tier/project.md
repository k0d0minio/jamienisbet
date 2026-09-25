# Project: desk-tier

The run's context card — what a fresh session needs before it reads anything else. Pointers,
not copies: the spec stays the spec, the scope stays the scope. Seeded when the run is opened
(`new-run.sh` → `run-pack.sh --init`), sharpened by whichever stage learns something. Read with
`status.md` and `handoff.md` on every resume (`_shared/stage-preamble.md`).

- stub: intake/admin-cockpit-redesign/desk-tier.md
- scope: .icm/runs/admin-cockpit-redesign/01_scope/output/scope.md
- spec: 02_define/output/spec.md
- touches: packages/ui/tokens/desk.css, packages/ui/desk.css, packages/ui/src/components/desk, packages/ui/src/index.ts, packages/ui/package.json, packages/ui/BRAND.md, packages/ui/SKILL.md, packages/ui/README.md, .claude/skills/design-dna/SKILL.md
- complexity: complex → model: opus (executor — select-model.sh --stage 03_build)

## Constraints

- No file under `websites/` changes; no existing token file, `styles.css`, `tokens.css`,
  `app.css`, or `components/{ui,brand,motion,app}` file changes (D-22; spec criterion 10).
- No new hue and no raw colour value: desk colours alias the semantic tokens (D-3, stub notes).
- Flat: no materials, no springs; a shadow only on what floats (D-3).
- Hanken Grotesk UI, IBM Plex Mono metadata (D-4).
- The touch step lives in the tokens (one coarse-pointer block), never in a component.
- No new dependency; no preview/specimen page (operator, 2026-09-25).
- CI is the source of truth — no local build/lint/typecheck (`AGENTS.md`).

## Context budget

- Read the design canvas's design-system sheet (`project/Main.dc.html`) and the Leads/Work desk
  boards for exact row, header, rail and control sizes — the stub names the sheet as the reference.
