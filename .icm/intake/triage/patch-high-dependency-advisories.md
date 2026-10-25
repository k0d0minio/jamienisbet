# Stub: The dependency audit reports no high or critical advisory

- lane: chore
- found-by: portfolio-only/remove-sellers-site, `security-check.sh` · 2026-10-25
- complexity: low
- priority: P1

## Problem

`pnpm audit --audit-level=high` reports 9 high and 2 critical advisories on `main`. The modules are `next` (critical and high), `sharp`, `undici`, `zod` and `source-map-js`. `security-check.sh` returns `BLOCKED` on every commit because of them.

## Proposed change

Update the affected dependencies to their patched versions. Regenerate `pnpm-lock.yaml` with pnpm.

## Acceptance criteria

- [ ] `pnpm audit --audit-level=high` reports 0 high and 0 critical advisories.
- [ ] `security-check.sh` returns `OK` on a clean change.
- [ ] `ci` is green.
