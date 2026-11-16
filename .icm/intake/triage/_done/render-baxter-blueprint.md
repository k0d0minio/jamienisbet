# Stub: The repo gets the pipeline of the BAXTER blueprint

- lane: chore
- found-by: Jamie · 2026-11-16
- complexity: low
- priority: P1

## Problem

The repo has the pipeline of `legible-consulting/blueprint` v1.3.0. That blueprint is archived. The estate moves to the BAXTER blueprint, and this repo is a test repo for it.

## Proposed change

Render the BAXTER blueprint 1.0.0-rc7 into the repo. The files of the blueprint of before stay. The ticket `triage/remove-old-icm-structure` removes them.

## Acceptance criteria

- [ ] `.icm/_system/` exists, and `icm-check` is green.
- [ ] `CLAUDE.md` and `.claude/settings.json` point to the new pipeline.
- [ ] No file of the app changed.
