# Stub: pnpm audit reports 25 high + 2 critical advisories across the workspace

- lane: chore
- found-by: security-check · 2026-09-23 (chore/strip-unused-env-vars — `--branch` always runs the
  dependency audit; this branch touches no manifest or lockfile, so the finding predates it)
- complexity: medium

## Problem

`pnpm audit --audit-level=high` on `origin/main` (bb9caaf) reports 40 advisories total —
13 moderate, 25 high, 2 critical — all in transitive dependencies, not the workspace's own direct
deps. The high/critical ones seen: `browserslist` (unbounded memory growth, prototype-write crash
— via `next > styled-jsx > @babel/core > @babel/helper-compilation-targets`, pulled in by
`packages/app-shell`), `sharp` (libheif CVEs, via `packages/app-shell > next`), `js-yaml`
(`maxTotalMergeKeys` CPU-use, two separate advisories via `websites/portfolio > gray-matter` and
`websites/admin-dashboard > eslint > @eslint/eslintrc`), plus others `pnpm audit --audit-level=high`
lists in full. `security-check.sh <slug> --branch` reports `BLOCKED 1` (the dependency-audit
finding) on every branch regardless of that branch's own diff, since `--branch` always runs the
audit.

## Proposed change

Investigate: run `pnpm audit --audit-level=high` for the current full list, then `pnpm update` the
top-level packages (`next`, `eslint`, `gray-matter` and friends) that pull in the vulnerable
transitive versions, confirm the CI build + typecheck still pass, and re-run
`.icm/scripts/security-check.sh --all --audit` to confirm `RESULT: OK`.
