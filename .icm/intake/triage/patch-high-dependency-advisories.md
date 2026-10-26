# Stub: The dependency audit reports no high or critical advisory

- lane: chore
- found-by: portfolio-only/remove-sellers-site, `security-check.sh` · 2026-10-25
- complexity: low
- priority: P0

## Problem

`pnpm audit --audit-level=high` on `main` after pull request 201 reports 2 critical and 5 high advisories (re-audited 2026-10-25). `undici` left the lockfile with pull request 200. The rest:

| Module | Installed | Patched in | Pulled by |
|---|---|---|---|
| `next` | 16.3.6 | 16.4.1 or later | `package.json` (`^16.3.6`) |
| `zod` | 4.5.4 | 4.6.6 or later | `package.json` (`^4.4.3`) |
| `sharp` | 0.35.4 | 0.35.5 or later | `next` |
| `source-map-js` | 1.2.1 | 1.2.2 or later | `@tailwindcss/postcss`, through `@tailwindcss/node` |

Two of the four `next` advisories are unauthenticated remote code execution: one in the Image Optimization API with SVG files, one in `use cache` functions. The live site runs on this `next`. The other two are server-side request forgery in Image Optimization and denial of service in Server Actions.

## Proposed change

Update `next` and `zod` to the patched versions. Their ranges in `package.json` allow it. Update `sharp` and `source-map-js` to the patched versions where their parents' ranges allow it. Where a parent's range does not allow it, pin the patched version in `pnpm.overrides`. Regenerate `pnpm-lock.yaml` with pnpm.

## Acceptance criteria

- [ ] `pnpm audit --audit-level=high` reports 0 high and 0 critical advisories.
- [ ] `pnpm-lock.yaml` resolves `next` to 16.4.1 or later, `zod` to 4.6.6 or later, `sharp` to 0.35.5 or later and `source-map-js` to 1.2.2 or later.
- [ ] `ci` is green.
- [ ] The preview renders the home page, `/work`, one case study and the contact form with no visual change. A `next` minor bump needs this check.

## Notes

No hook and no CI job runs an audit. `security-check.sh` ran it by hand in the icm-board era, and that script left with pull request 202. An enforced audit is a change to `check-client.yml` in `legible-consulting/.github`, not to this repo.
