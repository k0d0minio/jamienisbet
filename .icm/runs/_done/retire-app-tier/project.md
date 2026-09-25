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

- No behaviour change on any screen: the port is mechanical, and only the look moves. An audit fix
  (a hover-only action made visible, a target raised to 44px) is the one exception.
- Money stays dormant (D-17, D-46): no nav entry, and no change to Stripe or Money server code.
- The marketing tier and the portfolio and sellers sites are untouched (D-22).
- Desk-tier motion is instant or a ≤120ms colour change, with no springs or slides; sheets keep
  their detents (D-48).
- The learned rules in `_shared/project-rules.md` apply, notably the packages/ui `Omit` rule,
  window scroll for pull-to-refresh, and `origin/main` as the diff base.

## Context budget

- Define read `packages/ui/src/index.ts`, `package.json`, the `app.css` header, the design-dna
  tier and motion sections and the BRAND.md headings, and ran targeted import and utility
  searches across `websites/admin-dashboard`. The stub's `touches:` had underestimated the
  footprint (about 40 files, not 12), and the spec had to name the real one.
