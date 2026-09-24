# Stub: env.sh pull never links, so the cloud env hook hydrates nothing on a fresh checkout

- lane: chore
- found-by: template-change · 2026-09-24
- complexity: low

## Problem

Found by the `ticket-view` Release code review (jamienisbet, 2026-09-24) — not this run's diff;
both files are template-owned. `.claude/hooks/vercel-env-hydrate.sh` hands off to
`.icm/scripts/env.sh pull` whenever the repo has `env.sh` and a deploy block, and exits 0. The
hook's own fallback path runs `vercel link --yes --project <name>` before pulling; `env.sh pull`
never links. A fresh cloud checkout has no `.vercel/` (gitignored), so every project reports
`FAILED … is the directory linked?`, the hook prints only the last line, and `.env.local` is never
written. `env.sh` also reads the token from the variable `deploy.token_env` names
(`VERCEL_TOKEN_KODOMINIO` here), not the `VERCEL_TOKEN` the hook checked, so a session holding only
`VERCEL_TOKEN` dies in `vercel_require` instead.

## Prompt

Template change request — from jamienisbet · 2026-09-24

In the icm-board repo (`~/Apps`), change the template-owned file
`_system/template/icm-pipeline/scripts/env.sh` (in every pipeline repo: `.icm/scripts/env.sh`, a
`T` line of the MANIFEST), and the canonical hook `_system/template/claude*/hooks/vercel-env-hydrate.sh`
(in every repo: `.claude/hooks/vercel-env-hydrate.sh`). Read `_system/contracts/PIPELINE.md` →
File-level ownership first.

What it says today (jamienisbet's copy, `.icm/template-version`: icm-board 7edd036):

`.claude/hooks/vercel-env-hydrate.sh`:
> if [[ -x "$ROOT/.icm/scripts/env.sh" ]] && [[ -f "$ROOT/.icm/project.json" ]] \
>    && jq -e '(.deploy.projects // []) | length > 0' "$ROOT/.icm/project.json" >/dev/null 2>&1; then
>   out="$("$ROOT/.icm/scripts/env.sh" pull --target "$TARGET" 2>&1 | tail -n1)"
>   say "via .icm/scripts/env.sh pull ($TARGET): ${out:-no output}"
>   exit 0
> fi

`.icm/scripts/env.sh` `cmd_pull`:
> if ! ( cd "$dir" && VERCEL_TOKEN="$vercel_token" vercel env pull .env.local --environment "$target" --yes ${team:+--scope "$team"} >/dev/null 2>&1 ); then
>   echo "  FAILED $name: vercel env pull did not write $envlocal (is the directory linked? vercel link --project $name${team:+ --scope $team})"; refused=$((refused+1)); continue

What it should say or do:

1. `env.sh pull`: before `vercel env pull`, when `$dir/.vercel/project.json` is absent, run
   `vercel link --yes --project "$name" ${team:+--scope "$team"}` in `$dir` with the same token
   (as the hook's fallback path does), and restore `.gitignore` if the CLI appended to it, as the
   pull branch already does. A failed link is the existing `FAILED $name` line.
2. `env.sh`'s token resolution: fall back to plain `VERCEL_TOKEN` when the variable
   `deploy.token_env` names is unset (the header comment already says "else plain VERCEL_TOKEN"),
   so a cloud session holding only `VERCEL_TOKEN` pulls.
3. The hook: print every `FAILED`/`REFUSED` line `env.sh pull` emits (not only the last line), so a
   failed hydrate is visible at session start.

Why: in any pipeline repo with a deploy block, a fresh cloud session starts with no `.env.local`
and a one-line message that hides the failure; the fallback path that linked first is unreachable
there. Found reading the branch of jamienisbet run `ticket-view` (PR #161) at Release.

Then: prove it (a read-only run against projects/jamienisbet on Jamie's machine with `.vercel/`
removed), ship it through a PR on a `claude/` branch, and after the merge bring `env.sh` back with
`_system/scripts/icm-sync.sh --apply projects/jamienisbet` — the other pipeline repos as
`/icm-check` lists them — and the hook by copying the new canonical file over
`projects/jamienisbet/.claude/hooks/vercel-env-hydrate.sh` in that repo's PR (`icm-check.sh`
reports the drift until it lands). Do not edit `projects/jamienisbet/.icm/scripts/env.sh` in
place. Retire `projects/jamienisbet/.icm/intake/triage/template-change-env-pull-unlinked.md` to
`_done/` in the sync commit.
