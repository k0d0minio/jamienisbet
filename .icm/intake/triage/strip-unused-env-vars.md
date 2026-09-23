# Stub: Strip the environment variables nothing needs

- lane: chore
- found-by: env.sh audit during the pipeline adoption (2026-09-23)
- priority: P2
- size: S
- depends-on: k0d0minio/jamienisbet#136 (the rewritten `.env.example` manifests this edits)
- sources: `websites/*/.env.example`, `websites/admin-dashboard/lib/stripe.ts` (`siteOrigin`), `websites/admin-dashboard/lib/{deals,onboarding,icm-scaffold,github,portfolio}.ts`, `websites/portfolio/lib/icm-board.ts`, `packages/services/src/ai.ts` (`isGatewayConfigured`), `.icm/scripts/env.sh audit`

## What this is

The first full `env.sh audit` against Vercel (Kodominio team) showed each app's env surface
is wider than what the code uses. Three kinds of excess:

1. **Set on Vercel, read by nothing.**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` on `jamie-nisbet` (admin) — no `process.env` read anywhere.
   - `AI_GATEWAY_API_KEY` on `portfolio` — only the admin dashboard calls the AI Gateway
     (`isGatewayConfigured` / `draftModelFor` are imported by `websites/admin-dashboard` only).
   - The Neon–Vercel integration's extras on all three projects — `DATABASE_URL_UNPOOLED`,
     `NEON_AUTH_BASE_URL`, `NEON_PROJECT_ID`, `PG*` (5), `POSTGRES_*` (8), `VITE_NEON_AUTH_URL`.
     The code reads `DATABASE_URL` only. These are **integration-managed**: deleting one by
     hand may be undone on the next integration sync. Check whether the Neon integration's
     settings can limit what it injects before touching them; if it cannot, leave them and
     keep the manifest notes.
   - The CI migrate job uses the `DATABASE_URL` Actions secret; unaffected.

2. **Dead code behind a variable.** `siteOrigin()` in `websites/admin-dashboard/lib/stripe.ts`
   is the only reader of `NEXT_PUBLIC_SITE_URL` and has no callers.

3. **Overrides that are never overridden.** Default-backed knobs, unset on every Vercel
   project, now declared `[optional]`:
   `ICM_BOARD_REPO` (admin `lib/deals.ts` and portfolio `lib/icm-board.ts`),
   `ICM_BOARD_INTAKE_FORM`, `ICM_TEMPLATE_REPO`, `ONBOARDING_REPO`, `ONBOARDING_FOLDER` — all
   point at `k0d0minio/icm-board` paths and could be plain constants.
   `PORTFOLIO_BASE_URL` (documented use: point form links at a preview) and
   `GITHUB_REPO_OWNER` (home client repos in an org) have a stated purpose — keep them unless
   Jamie says otherwise.

Values are never read or printed doing this — names only. Removing a Vercel variable is an
outward change to production config: list what will be removed and get Jamie's yes before
running `vercel env rm`.

## Prompt

In this repo, strip the environment variables nothing needs. Read
`.icm/intake/triage/strip-unused-env-vars.md` first — it lists every candidate with its
evidence. Confirm k0d0minio/jamienisbet#136 is merged (the manifests you will edit), then:

1. Delete `siteOrigin()` from `websites/admin-dashboard/lib/stripe.ts` (re-grep for callers
   first) and drop `NEXT_PUBLIC_SITE_URL` from `websites/admin-dashboard/.env.example`.
2. Replace the never-overridden icm-board knobs with constants: `ICM_BOARD_REPO`,
   `ICM_BOARD_INTAKE_FORM`, `ICM_TEMPLATE_REPO`, `ONBOARDING_REPO`, `ONBOARDING_FOLDER`
   (keep the current default values, in one place per app), and remove their `[optional]`
   blocks from the manifests. Keep `PORTFOLIO_BASE_URL` and `GITHUB_REPO_OWNER` unless the
   operator says otherwise.
3. Drop the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` block (admin) and the `AI_GATEWAY_API_KEY`
   block (portfolio) from the manifests, and list for the operator the matching Vercel removals
   (`vercel env rm <KEY> production|preview --scope kodominio` per project). Do not run them
   without an explicit yes in the session.
4. For the Neon integration's extra variables: find out (Vercel/Neon docs, the integration's
   settings) whether it can be told to inject fewer. Report the answer; change nothing on
   Vercel for these unless it can, and the operator agrees.
5. Re-run `.icm/scripts/env.sh audit` with `VERCEL_TOKEN_KODOMINIO` in the shell (names only)
   and include its RESULT line in the PR. CI is the verdict for the code change; never run
   build/lint/typecheck locally.
