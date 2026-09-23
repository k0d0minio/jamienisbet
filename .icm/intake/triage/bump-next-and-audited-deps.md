# Stub: Bump Next.js and the transitive deps `pnpm audit` flags high/critical

- lane: chore
- found-by: security-check · 2026-09-23 (the `fix-collaborator-repos` bug lane's `--branch` gate)
- priority: P1
- size: S
- sources: `pnpm-lock.yaml`, `websites/*/package.json`

## What this is

`pnpm audit --audit-level=high` reports 27 high/critical advisories on `main`, none introduced by
the lane that found them. The ones that matter: **`next` 16.x below 16.3.3 (2 critical, 4 high)**
in every app. The rest are transitive — `sharp` (<0.35.4), `postcss` (<=8.5.17), `nanoid`
(<3.3.18), `js-yaml` (3.x <3.15.2, 4.x <4.3.2), `brace-expansion` (several ranges),
`browserslist` (<=4.28.6).

Until this lands, every lane's `security-check.sh --branch` reports `BLOCKED` on the audit.

## Prompt

In this repo, run `pnpm audit --audit-level=high`, bump `next` to >=16.3.3 in every
`websites/*/package.json` (and `eslint-config-next` in step), and clear the transitive advisories
with the smallest change that works — a direct bump where the package is a direct dependency,
otherwise `pnpm.overrides` in the root `package.json`. Regenerate `pnpm-lock.yaml` with pnpm,
never by hand. Re-run the audit until it reports no high/critical advisories. Don't run
build/lint/typecheck locally — push on a `claude/` branch, open a PR, and read CI. `git mv` this
stub to `.icm/intake/triage/_done/` in the same PR.
