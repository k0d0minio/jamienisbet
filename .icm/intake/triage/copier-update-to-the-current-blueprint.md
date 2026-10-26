# Stub: The repo renders from the blueprint's current tag

- lane: chore
- found-by: the intake audit · 2026-10-25
- complexity: low
- priority: P1

## Problem

`.copier-answers.yml` names blueprint v0.6.0 and carries `tier: app`. The blueprint is at v0.8.0 (2026-10-25). The tiers left at v0.7.0, and `monorepo`, `release` and `uat` are the questions now. Three blueprint-owned files differ from the template at v0.8.0. `.icm/intake/CONTEXT.md` lacks the user-story section and the UAT line. `.claude/settings.json` lacks the deny line `Read(./**/.env.*)`. `.github/workflows/ci.yml` still passes the `tier: app` input, which `check-client.yml` reads as a build. `CLAUDE.md` says "tier `app`" in its first paragraph.

## Proposed change

Run `copier update` to the blueprint's current tag with the answers of record. Keep the repo's own files as they are: `README.md`, `.icm/intake/README.md`, `CLAUDE.md` and `.gitignore`. Then take "tier `app`" out of the first paragraph of `CLAUDE.md`.

## Acceptance criteria

- [ ] `.copier-answers.yml` names the blueprint's current tag and has no `tier` line. Its answers are `monorepo: false`, `release: true` and `uat: false`. `slug`, `client_name` and `language` are unchanged.
- [ ] `.icm/intake/CONTEXT.md`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `.icm/scripts/new-run.sh`, `.icm/scripts/close-out.sh` and the three hooks equal the blueprint's rendered files at that tag.
- [ ] `CLAUDE.md` does not name a tier.
- [ ] `ci` is green.

## Notes

The answers are Jamie's, on pull request 203 (2026-10-26). One open point: `copier update` rewrites `.claude/settings.json` with the deny line `Read(./**/.env.*)`. Jamie's decision 3 on pull request 202 kept the file without that line. Default: the blueprint's file wins, and that decision is superseded. If Jamie wants the line out, he says so on the pull request, and the session takes it out after the update.
