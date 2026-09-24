# Stub: The cloud env hook hands off to env.sh pull, which never links the project directories

- lane: chore
- found-by: template-change · 2026-09-24
- priority: P2
- size: S

## Problem

Run `repo-and-estate-views`, Release code review (a first pass that read a stale local `main`
and so reviewed commits already on `origin/main`; the finding is real but not that run's).
`.claude/hooks/vercel-env-hydrate.sh` exits early into `.icm/scripts/env.sh pull --target …`
whenever the repo declares `deploy.projects` — before the hook's own remote-derived
`vercel link --project` step. `env.sh`'s `cmd_pull` then runs
`vercel env pull .env.local --environment … --yes` in each project directory without linking
it first. A fresh cloud checkout has no `.vercel/` in `websites/*`, so each pull either fails
("is the directory linked?") or, if the CLI links by folder name, reaches the wrong project —
in jamienisbet `websites/admin-dashboard` is Vercel project `jamie-nisbet` and
`websites/sellers-site` is `client-referrals`. Either way `.env.local` stays empty in a cloud
session. Read from the code, not reproduced in a session holding `VERCEL_TOKEN`.

Also found independently by run `ticket-view`'s Release code review (same stale-`main` cause),
with one more fault in the same path: `env.sh` reads the token from the variable
`deploy.token_env` names (`VERCEL_TOKEN_KODOMINIO` here), not the `VERCEL_TOKEN` the hook
checked, so a session holding only `VERCEL_TOKEN` stops in `vercel_require` — the header comment
says "else plain VERCEL_TOKEN". And the hook prints only the last line of `env.sh pull`'s output,
so every `FAILED` line but one is hidden at session start.

## Prompt

Template change request — from jamienisbet · 2026-09-24

In the icm-board repo (`~/Apps`), change two template-owned files: the canonical hook
`_system/template/claude/hooks/vercel-env-hydrate.sh` (every repo's
`.claude/hooks/vercel-env-hydrate.sh`) and `_system/template/icm-pipeline/scripts/env.sh`
(every pipeline repo's `.icm/scripts/env.sh`, a `T` line of the MANIFEST). Read
`_system/contracts/PIPELINE.md` → File-level ownership first.

What they say today (jamienisbet's copies, `.icm/template-version`: icm-board 7edd036):
> # The pipeline's own env.sh owns this flow where the repo carries it AND declares a deploy block
> if [[ -x "$ROOT/.icm/scripts/env.sh" ]] && … jq -e '(.deploy.projects // []) | length > 0' …; then
>   out="$("$ROOT/.icm/scripts/env.sh" pull --target "$TARGET" 2>&1 | tail -n1)"

and in `env.sh` → `cmd_pull`:
> ( cd "$dir" && VERCEL_TOKEN="$vercel_token" vercel env pull .env.local --environment "$target" --yes ${team:+--scope "$team"} )

with no `vercel link` anywhere on that path.

What it should do:
`env.sh pull` links each `deploy.projects[]` directory to its declared project before pulling —
`vercel link --yes --project <name> ${team:+--scope <team>}` when `<dir>/.vercel/project.json` is
absent or names a different project — using the project **name** from `project.json`, never the
folder name, so `--yes` can never create a project. A link failure is that project's
`FAILED <name>: …` line, as today, and the rest carry on. The hook keeps its early hand-off.
Keep the token off argv and out of temp files, as both scripts already do.

Why: a cloud session in a repo with a deploy block gets no environment at all, and the pull's
fallback message points at a manual link a cloud session has no reason to run.

Verify: in a fresh cloud session on jamienisbet with `VERCEL_TOKEN` set, the session-start line
reads `via .icm/scripts/env.sh pull (…): RESULT: OK`, and `websites/admin-dashboard/.env.local`
holds the `jamie-nisbet` project's keys (names only checked — never print values).
