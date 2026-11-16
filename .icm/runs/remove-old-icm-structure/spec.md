# Spec: Remove the pipeline files of the blueprint of before

- ticket: triage/remove-old-icm-structure
- touches: .icm/intake/CONTEXT.md, .icm/intake/README.md, .icm/lanes/, .icm/scripts/, .copier-answers.yml, .claude/hooks/route-request.sh, .claude/hooks/route-request.test.sh, .claude/hooks/session-start.sh, .claude/hooks/block-local-checks.sh, .claude/hooks/confirm-git-writes.sh, .claude/settings.json, .claude/skills/pr-conventions/, .claude/skills/ticket-craft/, .github/workflows/gate.yml, .github/pull_request_template.md, CLAUDE.md, README.md
- complexity: standard

## Problem

The repo has two pipelines. The BAXTER blueprint is in `.icm/_system/` and it is the one in use. The files of `legible-consulting/blueprint` v1.3.0 stay beside it. Old and new files together give a session two sets of rules.

## Proposed change

A session that opens the repo finds one pipeline: `.icm/_system/`. The files of the blueprint v1.3.0 are gone. `CLAUDE.md`, `README.md`, `.icm/intake/README.md`, the kept hooks and `.claude/settings.json` name no removed file. The site does not change.

Defaults for the questions in the pull request:
- Q1: `ci.yml` stays as it is.
- Q2: `.icm/lanes/hotfix/` goes. A production fault uses the lane `bug` of `.icm/_system/lanes/`.
- Q3: the repo skills `pr-conventions` and `ticket-craft` go. The skill `pipeline` and `.icm/_system/rules/` replace them.

## Acceptance criteria

- [ ] These paths are gone: `.icm/intake/CONTEXT.md`, `.icm/lanes/`, `.icm/scripts/`, the root `.copier-answers.yml`, `.claude/hooks/route-request.sh`, `.claude/hooks/route-request.test.sh`, `.claude/hooks/session-start.sh`, `.github/workflows/gate.yml`, `.github/pull_request_template.md`. (verify: agent)
- [ ] `.icm/.copier-answers.yml`, `.github/workflows/icm.yml`, `.github/workflows/ci.yml` and all of `.icm/_system/` stay with no change. (verify: agent)
- [ ] `CLAUDE.md` routes pipeline work only to `.icm/_system/ROUTER.md`. The rows for the app, the brand, the content, the copy and the email stay. No row names a removed path. (verify: agent)
- [ ] `.claude/settings.json` has no permission line for `.icm/scripts/`. Its hooks still call `block-local-checks.sh`, `confirm-git-writes.sh`, `guard-plaintext-secrets.sh` and `.icm/_system/hooks/dispatch.sh`. (verify: agent)
- [ ] The comments in `block-local-checks.sh` and `confirm-git-writes.sh` name no removed path. Their behaviour does not change. (verify: agent)
- [ ] `.icm/intake/README.md` describes the intake as `.icm/_system/rules/ticket.md` says and keeps the section "This backlog" and the decisions of record. `README.md` names no removed path. All stubs in `_done/` stay. (verify: agent)
- [ ] A search of the repo outside `.icm/_system/`, `.icm/archive/` and the `_done/` stubs finds no reference to `.icm/scripts/`, `.icm/lanes/`, `.icm/intake/CONTEXT.md` or `pull_request_template.md`. (verify: agent)
- [ ] The checks `icm-check` and `ci` on the pull request are green. (verify: CI)
- [ ] The Vercel preview of the pull request shows the same home page and case studies as production. (verify: operator)

## Out of scope

- A change to `.icm/_system/`. It belongs to the blueprint.
- A change to `ci.yml` (Q1 default).
- A change to the code of the app, the content, the copy or the brand.
- A change to a GitHub ruleset or to branch protection.
- The edit of a stub in `_done/`. They are records and keep their old paths.

## Open questions

- `gate.yml` says that a ruleset requires the check `gate / gate` on `main`. On 2026-11-16 the API shows no ruleset and no branch protection on `main`. Thus the removal of `gate.yml` does not block a merge.
