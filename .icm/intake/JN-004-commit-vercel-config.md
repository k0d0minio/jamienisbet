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

## Prompt

Commit the Vercel deployment configuration for the four apps in the jamienisbet monorepo
(portfolio, admin-dashboard, payment-gateway, sellers-site). Read
.icm/intake/JN-004-commit-vercel-config.md for full context. Inspect the current Vercel
project settings first and mirror them into the repo. Open a PR on a claude/ branch; do not
run local checks — CI is the source of truth.
