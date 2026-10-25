# Stub: A session reads CLAUDE.md and the ticket contract, and nothing from the icm-board era

- feature-slug: retire-legacy-pipeline
- epic: portfolio-only
- sequence: 6 of 6
- depends-on: one-app-at-root
- complexity: medium
- priority: P1

## Problem

The repo still carries the icm-board era: `.icm/` stages, lanes, runs, `_shared`, skills, 30 scripts, `project.json`, `project.md`, `MANIFEST`, `docs/` and `template-version`, the `.claude/` agents, skills and six hooks, `.opencode/`, `opencode.jsonc`, `.github/labels.yml`, and `AGENTS.md`, which `CLAUDE.md` imports. They describe a pipeline that no longer exists and contradict `.icm/intake/CONTEXT.md`.

## Proposed change

Delete them. Write `CLAUDE.md` in the blueprint's shape: identity and routing, under 80 lines, with the app's own routing rows. Rewrite `README.md` for one app. Keep only what the blueprint renders and the app's own code.

## Acceptance criteria

- [ ] `.icm/` holds `intake/`, `scripts/new-run.sh` and `scripts/close-out.sh` only.
- [ ] `.claude/` holds `settings.json` and the three blueprint hooks only.
- [ ] `.opencode/`, `opencode.jsonc`, `.github/labels.yml`, `AGENTS.md` and `SKILL.md` are gone.
- [ ] `CLAUDE.md` is under 80 lines. It routes to `.icm/intake/CONTEXT.md`, `.github/pull_request_template.md`, `README.md`, the content folder, `tokens/` and `BRAND.md`, and carries the blueprint's rules.
- [ ] `README.md` describes one app: what it is, how it runs, the content, the brand, the deployment. No reference to icm-board, `_system/`, the admin dashboard or the sellers site.
- [ ] `ci` is green.

## Out of scope

- A record of what `.icm/docs/` held. It is deleted with the rest, and nothing is written in its place.

## Notes

The shape is `templates/app/CLAUDE.md.jinja` in `legible-consulting/blueprint`. Copier wrote `CLAUDE.md` once and never overwrites it, so this rewrite is the repo's own. Check that `.claude/settings.local.json` stays gitignored.
