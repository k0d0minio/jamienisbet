# JN-014 · Restructure the sustentus pipeline for story-based intake

| | |
|---|---|
| Status | ready |
| Type | chore |
| Priority | P1 |
| Size | L |

## Problem

How we work with Paul and David has changed: work now arrives as a written user story from
either of them, the demo app (`apps/demo`) is no longer actively developed, and specs build
directly against `apps/web` where a demo tenant exists (production and preview). The
sustentus delivery pipeline still encodes the old flow — Google-Doc scope round-trip with
Paul, a Design stage prototyping in `apps/demo`, and a `pipeline/` folder name. The full
analysis and every decision (all confirmed by Jamie 2026-08-13) are in
[.icm/docs/sustentus-pipeline-restructure.md](../docs/sustentus-pipeline-restructure.md).

## Acceptance

- [ ] Sustentus PR (one, combined) merged: `pipeline/` → `.icm/`, Design stage removed,
      stages renumbered 01–05 with legacy fallbacks, Scope/approve rewritten for story
      intake (story + addendum `scope.md`), `apps/demo` frozen-in-place annotations, all
      path references updated (scripts, workflows, `.claude/`, `.prettierignore`, docs).
- [ ] The PR nowhere mentions machine-local/estate conventions as the rename motivation.
- [ ] CI on the PR is green, including the pipeline intake/spec checks.
- [ ] Apps PR merged: `_system` EXEMPT lists fixed to `sustentus`, CLAUDE.md standing rule
      updated, admin-dashboard tickets exclusion confirmed.
- [ ] Local untracked `.claude/settings.local.json` in sustentus repaired (not in any PR).

## Prompt

Execute the sustentus pipeline restructure. Work on this machine — the repo is
`~/Apps/projects/sustentus` (gitignored in Apps; not visible to cloud sessions). Read
`~/Apps/.icm/docs/sustentus-pipeline-restructure.md` first and follow it exactly: the
decisions there are Jamie's answers, already settled — do not relitigate them. Re-grep all
file:line references before editing (they drift). One combined PR in sustentus with clean
commits (mv → mechanical paths → renumber → contract rewrites → freeze/cleanups), Ready to
merge anchor only; a second small PR in Apps for the estate side. Never tick gates, never
run local checks — push and read CI. Ask Jamie before touching `db-migrate.yaml` env wiring.
