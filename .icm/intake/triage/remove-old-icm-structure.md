# Remove the pipeline files of the blueprint of before

- complexity: standard
- lane: spine

## Problem

The repo has two pipelines. The BAXTER blueprint is in `.icm/_system/` and it is the one in use. The files of `legible-consulting/blueprint` v1.3.0 stay beside it: `.icm/intake/CONTEXT.md`, `.icm/lanes/`, `.icm/scripts/`, the root file `.copier-answers.yml`, three hook files in `.claude/hooks/` that no setting calls (`route-request.sh`, `route-request.test.sh`, `session-start.sh`), the workflow `.github/workflows/gate.yml`, the file `.github/pull_request_template.md`, the routing rows of `CLAUDE.md` that name those files, and the permission lines of `.claude/settings.json` for `.icm/scripts/`. Old and new files together give a session two sets of rules.

## Acceptance criteria

- [ ] No file of the blueprint of before stays in `.icm/`, `.claude/hooks/` and `.github/`, and `.copier-answers.yml` at the root is gone.
- [ ] `CLAUDE.md` routes pipeline work only to `.icm/_system/ROUTER.md`. The rows for the app, the brand and the content stay.
- [ ] `.claude/settings.json` has no permission line for a removed script. The three guards of the repo stay: `block-local-checks.sh`, `confirm-git-writes.sh`, `guard-plaintext-secrets.sh`.
- [ ] `.icm/intake/README.md` describes the intake as `.icm/_system/rules/ticket.md` says. The stubs in `_done/` stay.
- [ ] `icm-check` and the code checks of the repo are green, and the preview shows the site of before.

## Questions

### Q1. The workflow `ci.yml` only calls `legible-consulting/.github`. What happens to it?
- type: single
- options: Keep it as it is in this ticket | Replace it with a workflow of this repo in this ticket
- default: Keep it as it is in this ticket
- answer: _waiting_

### Q2. The lane `hotfix` of before has no lane in the BAXTER blueprint. What happens to it?
- type: single
- options: Remove it, a production fault uses the lane bug | Keep the folder outside `_system/` as a repo file
- default: Remove it, a production fault uses the lane bug
- answer: _waiting_
