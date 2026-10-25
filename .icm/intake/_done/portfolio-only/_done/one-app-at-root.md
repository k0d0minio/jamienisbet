# Stub: The repo is one Next.js app at its root, with the brand tokens as files inside it

- feature-slug: one-app-at-root
- epic: portfolio-only
- sequence: 5 of 6
- depends-on: remove-admin-dashboard
- complexity: high
- priority: P1

## Problem

After stub 4 the pnpm workspace holds one app, `websites/portfolio`, and two packages it alone consumes, `packages/ui` and `packages/app-shell`. A workspace with one member is a monorepo for no reason. The blueprint's `tier: app` answer and `ci.yml` expect one app. The brand's tokens and the logo artwork are read by the house's desk design pass and must stay as files with their names.

## Proposed change

Move the portfolio to the repo root. Fold `packages/ui` and `packages/app-shell` into it as plain folders. Remove the workspace, the root manifests that served it, and `quality.yaml`, because `ci.yml` runs the same checks.

## Acceptance criteria

- [ ] `package.json` at the root is the app's, with `dev`, `build`, `lint` and `typecheck`. `pnpm-workspace.yaml`, `tsconfig.base.json`, `websites/` and `packages/` are gone.
- [ ] The tokens are files under `tokens/` with their current names (`base`, `colors`, `desk`, `fonts`, `motion`, `radius`, `shadows`, `spacing`, `typography`), the logo artwork is under `assets/logo/`, and `BRAND.md` is at the root. No token value is inlined into a component.
- [ ] `styles.css` and `tokens.css` keep their names, and `app/globals.css` imports them once.
- [ ] No `@jamie-nisbet/*` import remains, and `transpilePackages` leaves `next.config.ts`.
- [ ] `.github/workflows/quality.yaml` is gone. `ci` is green.
- [ ] The preview renders the home page, `/work`, one case study and the contact form with no visual change.

## Out of scope

- Any restyle. `~/Desktop/legible-consulting/desk-design-prompt.md` § 4 and § 5 read these tokens. Keep their names and values.
- The house files that name the old `packages/ui/` path (breakdown, "For the house").

## Notes

Read `packages/ui/BRAND.md` and `packages/ui/SKILL.md` first. Keep `BRAND.md`. `SKILL.md` and `.claude/skills/design-dna/` leave in stub 6. The `.vercel/` link folder is gitignored and moves with the app. The Vercel project `portfolio` builds from Root Directory `websites/portfolio`, so the preview fails until Jamie sets the Root Directory to the repo root. Sequence: flip the pull request to ready on a green `ci`, Jamie changes the Root Directory, the preview builds, Jamie tests and merges. Nothing is pushed to `main` between the change and the merge. After the merge, the pull request body lists the new token and artwork paths for the house session.
