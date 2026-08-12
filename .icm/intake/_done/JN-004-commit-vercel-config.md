# JN-004 · Commit the Vercel deploy configuration

| | |
|---|---|
| Status | ready |
| Type | chore |
| Priority | P2 |
| Size | S |

## Problem

Deployment is configured in the Vercel UI per project (root directory, build command,
env wiring). Nothing in-repo reproduces it — a re-import would be manual archaeology.
(Carried over from the retired BACKLOG.md "Deferred" list.)

## Acceptance

- [ ] `vercel.json` (or documented equivalent) committed for all four app projects.
- [ ] A fresh Vercel import of either app deploys correctly from the committed config.
- [ ] Each project skips builds for irrelevant commits (`ignoreCommand`, e.g.
      `npx turbo-ignore`) — since the 2026-08-12 consolidation, ticket flips in
      `.icm/intake/` and `_system/` edits land on this repo's `main`, and they must
      not trigger four app deploys.

## Resolution (2026-08-12)

Shipped as one `vercel.json` per app. Deviation from the example: the repo has no turbo, so the
skip rule is `git diff --quiet HEAD^ HEAD -- <the app's real inputs>` rather than
`npx turbo-ignore` (fails open when `HEAD^` is missing). The Root-Directory ↔ project ↔ domain
mapping that `vercel.json` cannot express is documented in `websites/README.md` § Deployment.

## Prompt

Commit the Vercel deployment configuration for the four apps in the jamienisbet monorepo
(portfolio, admin-dashboard, payment-gateway, sellers-site). Read
.icm/intake/JN-004-commit-vercel-config.md for full context. Inspect the current Vercel
project settings first and mirror them into the repo, and add an ignoreCommand per
project (e.g. npx turbo-ignore) so commits touching only .icm/ or _system/ skip all
app builds. Open a PR on a claude/ branch; do not run local checks — CI is the source
of truth.
