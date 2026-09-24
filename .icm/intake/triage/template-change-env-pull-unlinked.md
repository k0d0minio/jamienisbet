# Stub: the cloud env-hydrate hook hands off to `env.sh pull`, which never links the app folders

- lane: chore
- found-by: template-change · 2026-09-24
- complexity: medium

## Problem

`.claude/hooks/vercel-env-hydrate.sh` (canonical `.claude/` asset) short-circuits to
`.icm/scripts/env.sh pull --target <env>` whenever the repo carries `env.sh` and a deploy block,
then exits. `env.sh`'s `cmd_pull` (template-owned — `T scripts/env.sh`) runs
`vercel env pull .env.local` in each app folder but never `vercel link`s it first; the hook's own
fallback path did (`vercel link --yes --project …`, around line 240). In a fresh cloud session
`.vercel/` is gitignored, so no folder is linked: every project fails with "is the directory
linked?" and the pull ends `RESULT: REFUSED`. The hook prints only that last line and exits 0, so
it reads as a quiet no-op, and no `.env.local` is written. The early branch also bypasses the
hook's `VERCEL_ENV_MAX_AGE` freshness check (default 3600 s), so a pull that does work repeats on
every session start and resume. Found by `epic-view` Release code review (reading the code, not
a failed run: this session had no `VERCEL_TOKEN`); unverified against a live pull.

## Prompt

Template change request — from jamienisbet · 2026-09-24

In the icm-board repo (`~/Apps`), change two template-owned files — the fault spans both:
`_system/template/icm-pipeline/scripts/env.sh` (in every pipeline repo: `.icm/scripts/env.sh`, a
`T` line of the MANIFEST) and the canonical `.claude/` asset
`_system/template/claude*/hooks/vercel-env-hydrate.sh` (every repo: `.claude/hooks/vercel-env-hydrate.sh`).
Read `_system/contracts/PIPELINE.md` → File-level ownership first.

What they say today (jamienisbet's copies, `.icm/template-version`: icm-board 7edd036):

> hook, ~line 104: if [[ -x "$ROOT/.icm/scripts/env.sh" ]] && [[ -f "$ROOT/.icm/project.json" ]] && jq -e '(.deploy.projects // []) | length > 0' … ; then out="$("$ROOT/.icm/scripts/env.sh" pull --target "$TARGET" 2>&1 | tail -n1)"; say "via .icm/scripts/env.sh pull ($TARGET): ${out:-no output}"; exit 0; fi
> env.sh cmd_pull: ( cd "$dir" && VERCEL_TOKEN="$vercel_token" vercel env pull .env.local --environment "$target" --yes ${team:+--scope "$team"} ) || { echo "  FAILED $name: vercel env pull did not write $envlocal (is the directory linked? …)"; … }

What they should do:
- `env.sh pull`: before pulling in a folder with no `.vercel/project.json`, link it
  non-interactively to the declared project (`vercel link --yes --project <name> [--scope <team>]`,
  token from the environment, never argv), refusing — not creating — a project the team does
  not have; then pull. The `FAILED` line stays for a link or pull that still fails.
- The hook: keep the `VERCEL_ENV_MAX_AGE` check ahead of the hand-off (skip when every
  `.env.local` is fresher than the max age), and surface a `REFUSED`/`FAILED` result as a
  visible warning line rather than the same shape as success.
- Fixture: a checkout with no `.vercel/` and a declared deploy block pulls every project on the
  first session start and skips on the second within the max age.

Why:
jamienisbet's `epic-view` Release code review (2026-09-24) traced the hand-off: in a fresh cloud
session no app folder is linked, so the hydrate hook silently writes no `.env.local` for
portfolio, jamie-nisbet or client-referrals. Every pipeline repo with a deploy block and cloud
sessions has the same gap.

Then: prove it (the fixture, or a read-only run against projects/jamienisbet on Jamie's machine),
ship it through a PR on a `claude/` branch, and after the merge bring it back with
`_system/scripts/icm-sync.sh --apply projects/jamienisbet` (and copy the new canonical hook over
`projects/jamienisbet/.claude/hooks/vercel-env-hydrate.sh` in that PR — `icm-check.sh` reports
the drift until it lands) — the other pipeline repos as `/icm-check` lists them. Do not edit
`projects/jamienisbet/.icm/scripts/env.sh` or the hook in place. Retire
`projects/jamienisbet/.icm/intake/triage/template-change-env-pull-unlinked.md` to `_done/` in
the sync commit.
