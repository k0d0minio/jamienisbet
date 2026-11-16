# Handoff remove-old-icm-structure

## Next action

The operator tests the Vercel preview of pull request #218 and ticks Ready to merge. Then the operator merges with the button "Merge now" or says `release triage/remove-old-icm-structure`.

## Acceptance criteria

- Met (agent): the old paths are gone. This includes the skills `pr-conventions` and `ticket-craft` (Q3).
- Met (agent): `.icm/.copier-answers.yml`, `.github/workflows/icm.yml`, `.icm/_system/` and the `_done/` stubs have no change against `main`.
- Met (agent): `ci.yml` has one job of this repo: pnpm install, `lint`, `typecheck`, `build` on Node 24. The name stays `ci`. No `uses:` of `legible-consulting/.github`.
- Met (CI): the `ci` run on 654cfe9 shows the steps lint, typecheck and build, each green.
- Met (agent): `CLAUDE.md` routes pipeline work to `.icm/_system/ROUTER.md` only. "change what CI checks" goes to `.github/workflows/ci.yml`.
- Met (agent): `.claude/settings.json` has no permission line for `.icm/scripts/`. The four hook calls stay.
- Met (agent): the hook comments name `.icm/_system/scripts/`. Only comment and message text changed.
- Met (agent): `.icm/intake/README.md` points to `.icm/_system/rules/ticket.md` and keeps "This backlog" and the decisions of record. `README.md` names no removed path.
- Met (agent): a search outside `.icm/_system/`, `.icm/archive/`, the `_done/` stubs and this run's own records finds no reference to a removed path.
- Met (CI): `icm-check` and `ci` are green.
- Open (operator): the preview shows the same home page and case studies as production.

## How to test

Open the Vercel preview of pull request #218. Look at the home page and two case studies. They must look the same as on jamienisbet.com.

## Answers of record

- Q1: Replace `ci.yml` with a workflow of this repo in this ticket.
- Q2: Remove the lane `hotfix`. A production fault uses the lane `bug`.
- Q3: Delete the skills `pr-conventions` and `ticket-craft`.
- Q4: The new `ci.yml` runs only lint, typecheck and build.

## Blockers

- Ready to merge is not ticked.

## Do not touch

- `.icm/_system/`, `.icm/.copier-answers.yml`, `.github/workflows/icm.yml`.
- The stubs in `_done/`.
