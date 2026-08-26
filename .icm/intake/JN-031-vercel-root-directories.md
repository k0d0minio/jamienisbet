# JN-031 · Repoint the four Vercel Root Directories at projects/jamienisbet/

| | |
|---|---|
| Status | today |
| Type | chore |
| Priority | P0 |
| Size | S |

## Problem

The web estate moved from the repo root to `projects/jamienisbet/` so the root could be the
ICM control layer alone. Everything that lives in git moved with it and is covered by the
same PR: CI working directories, the workspace root, the dashboard's `.icm/onboarding/`
tracing, every doc path.

**Root Directory is not in git.** It is a per-project setting in the Vercel dashboard, and
until it is changed by hand all four projects still point at paths that no longer exist.
Preview builds for `portfolio` and `jamie-nisbet` will fail on the PR branch (the other two
have preview deploys disabled in their `vercel.json`), and merging before the settings change
takes production down on the next push.

This is a human step — no session should attempt it, and no session can verify it from the
repo.

## Acceptance

- [ ] `portfolio` → Root Directory `projects/jamienisbet/websites/portfolio`
- [ ] `jamie-nisbet` → `projects/jamienisbet/websites/admin-dashboard`
- [ ] `payment-gateway` → `projects/jamienisbet/websites/payment-gateway`
- [ ] `client-referrals` → `projects/jamienisbet/websites/sellers-site`
- [ ] Each project's *Include source files outside of the Root Directory in the Build Step*
      is still **on** (the apps read `packages/*`; the dashboard also reads `.icm/onboarding/`
      from the repo root)
- [ ] The move PR is merged only after the four settings are saved
- [ ] After the first production deploy: open `app.jamienisbet.com` → a lead's profile →
      Forms card, and confirm the house questionnaires still list (this is what proves the
      widened `outputFileTracingRoot` works; a tracing miss falls back to the GitHub contents
      API, so a *slow* list is a partial failure worth noting, not a pass)

## Prompt

Human-only ticket — do not action it in a session. It records the four Vercel dashboard
settings that must change alongside the move of the web estate into `projects/jamienisbet/`,
because Root Directory cannot be set from `vercel.json` or any file in the repo. The mapping
and the reasoning live in `projects/jamienisbet/websites/README.md` § Deployment. If a session
is asked why every app is failing to build with a missing lockfile or "no Next.js version
detected", this ticket is the answer.
