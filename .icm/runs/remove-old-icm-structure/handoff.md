# Handoff remove-old-icm-structure

## Next action

The operator reads the revised spec and ticks Spec approved again in pull request #218. Then the operator says `build triage/remove-old-icm-structure`.

## Answers of record

- Q1: Replace `ci.yml` with a workflow of this repo in this ticket. This is not the default.
- Q2: Remove the lane `hotfix`. A production fault uses the lane `bug`. This is the default.
- Q3: Delete the skills `pr-conventions` and `ticket-craft`. This is the default.
- Q4: The new `ci.yml` runs only lint, typecheck and build. This is not the default.

## The revise of 2026-11-16

The spec now replaces the call in `ci.yml` with one job of this repo: pnpm install, lint, typecheck, build on Node 24. The workflow name stays `ci`. `CLAUDE.md` routes "change what CI checks" to `ci.yml`. Tests, a format check and the other jobs of `check-client.yml` are out of scope.

## How to test

Open the Vercel preview of pull request #218. Look at the home page and two case studies. They must look the same as on jamienisbet.com.

## Blockers

- Spec approved must be ticked again after the revise.

## Do not touch

- `.icm/_system/`, `.icm/.copier-answers.yml`, `.github/workflows/icm.yml`.
- The stubs in `_done/`.
