# JN-014 · Cut deployment spend — built-in skipping, no turbo, previews only where useful

| | |
|---|---|
| Status | ready |
| Type | chore |
| Priority | P1 |
| Size | S |

## Problem

The estate is on the Vercel free tier and hit its ceiling on 2026-08-13:

```
Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")
```

JN-013's `ignoreCommand` does **not** help with that cap, and this is the crux. An Ignored
Build Step runs *after* Vercel has created the deployment; per Vercel's own docs the
cancelled deployment still "count[s] towards your deployment and concurrent build limits".
So four projects watching one repo cost **four deployments on every push**, forever,
however many builds the ignore step skips. It was saving build minutes, not quota.

Vercel's built-in monorepo skipping decides *before* a deployment exists — an unaffected
project gets no deployment at all. It is on by default, and setting an `ignoreCommand`
opts out of it, which is what this repo had been doing since JN-013.

This ticket also closes out the preview gap that JN-014 originally chased: on the first
push of a new branch `turbo-ignore` has no `VERCEL_GIT_PREVIOUS_SHA` and builds all four.
That is now moot, but the finding is recorded below so nobody retries it.

## Acceptance

- [ ] No `ignoreCommand` in any `websites/*/vercel.json` — built-in skipping is in effect
- [ ] A single-app commit creates **one** deployment, not four
- [ ] `packages/ui` commit still deploys all four
- [ ] The dashboard still redeploys when `.icm/onboarding/` changes
- [ ] `turbo` and `turbo.json` removed — `turbo-ignore` was their only consumer
- [ ] `payment-gateway` and `sellers-site` deploy only from `main`; no preview deployments
- [ ] `websites/README.md` § Deployment explains the mechanism, the deployment-cap
      reasoning, and the accepted cost
- [ ] `.github/workflows/ci.yml` untouched — still `pnpm -r` and the per-app matrix
- [ ] Post-merge, confirm on real pushes (see Notes)

## Accepted cost

Anything outside the workspace definition (`packages/*`, `websites/*`) is a global change
and deploys all four apps — `.icm/`, `_system/`, `.claude/`, `.github/`, `CLAUDE.md`, root
configs. Ticket-only commits therefore *build* all four where the old rule skipped them.

Taken knowingly: those commits already cost four deployments under either mechanism, and
app commits — the majority — drop from four deployments to one.

## Notes

`turbo` and `turbo.json` are removed here too — `turbo-ignore` was their only consumer, and
it is deprecated in favour of the mechanism this ticket adopts. The `pnpm-lock.yaml` regen
drops only `@turbo/*` platform binaries, no other version moves. Vercel's build logs will
stop saying "Detected Turbo. Adjusting default settings…"; each app builds from its own
Root Directory as a plain Next.js project, which is what CI already proves works (the
per-app matrix has never used turbo).

Why the preview fallback JN-014 originally proposed is impossible, so it is not attempted
again: `turbo-ignore`'s comparison order is `VERCEL_GIT_PREVIOUS_SHA` → `--fallback` →
nothing-means-build, so a fallback is safe in principle. But Vercel's build clone has no
`origin` remote (`fatal: 'origin' does not appear to be a git repository`) and no branch
refs at all — `origin/main`, `refs/remotes/origin/main`, `main` and `refs/heads/main` were
all probed on a live build and none resolved. No system variable exposes a base SHA
either. `HEAD^` is the only ref that always resolves, and on a multi-commit first push it
inspects only the last commit and skips real changes — the JN-004 bug.

Preview deployments are switched off for `payment-gateway` and `sellers-site`, the two apps
whose preview URL is rarely worth looking at. In each `vercel.json`:

```json
{ "git": { "deploymentEnabled": { "*": false, "**": false, "main": true } } }
```

Branch keys are minimatch patterns and **unspecified branches default to `true`**, so the
denial must be explicit — `{ "main": true }` on its own is a no-op. `*` catches flat branch
names, `**` catches slashed ones like `claude/x`, and `main` wins over both because a branch
matching several rules deploys if any rule is `true`.

`portfolio` and `admin-dashboard` keep previews. Extend the pattern to them only if the cap
starts biting again.

Verification after merge, on real pushes:

- `websites/portfolio`-only commit on a branch → one deployment total
- `packages/ui` commit on a branch → two (portfolio + dashboard; the other two are preview-off)
- `packages/ui` commit on `main` → four
- ticket-only commit on `main` → four (expected; the accepted cost)
- any branch push → `payment-gateway` and `sellers-site` create no deployment at all

## Prompt

Adopt Vercel's built-in monorepo skipping in place of the per-app `ignoreCommand`. Read
.icm/intake/JN-014-preview-deploy-fallback.md for full context, and websites/README.md
§ Deployment for the mechanism it replaces.

Open a PR on a claude/ branch; do not run local checks — CI is the source of truth.
