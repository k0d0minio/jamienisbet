# Stub: Re-run /setup so this repo carries the D43 quality job and the release workflow

- lane: chore
- found-by: estate audit 2026-09-26 (ruling 26) · 2026-09-26
- priority: P2
- complexity: low

## Problem

`.github/workflows/` holds `ci.yml` and `db-migrations.yml` only. Under D43 the estate's one CI
job is the advisory `quality.yaml`, and under D39 a repo whose `reporting.announce_from` is `ci`
gets `release.yaml` seeded once by `/setup`. Neither is here; `ci.yml` predates D43 and runs on
`push` to `main` as well.

## Proposed change

Run `/setup` in this repo and let it seed `quality.yaml` (filling its three `run:` steps with the
repo's own commands) and, if `announce_from` says so, `release.yaml`; retire `ci.yml` in the same
PR or reduce it to what `quality.yaml` does not cover. `required_checks` stays empty (the deploy
status is the verdict). Record the job under `.icm/_shared/project-rules.md` → The factory.
