# Failures: repo-and-estate-views

The run's retrospective — what cost a turn, and the rule that would have prevented it. Two
files share this job and split it cleanly: `error.log` (in the stage's `output/`) is the ledger
of errors a **tool** reported, written verbatim at the moment of the fix with its `- resolved:`
and `- rule:` lines, which `retrospective.sh` reads and counts across runs; **this file** is
what the run as a whole learned — a wrong assumption, a STOP, a skipped step, a gate that
blocked, a plan that had to be rewritten — which no tool ever logged. On close-out the
`## Learned rules` bullets below are copied into `_shared/project-rules.md` → Learned rules
(`run-pack.sh <slug> --sync-rules`, called by `close-out.sh`, the same shape as
`retrospective.sh --apply`), so the next run in this repo starts with them. Keep the rules
general; keep the retrospectives specific; never restate an `error.log` entry here.

## Retrospectives

### 2026-09-24 — Build invoked before the Spec approved gate was ticked

- what happened: `build repo-and-estate-views` ran while the PR's **Spec approved** box was
  still `[ ]`; Build STOPped at its gate check (step 2) before writing any code.
- why: the operator ran the next verb before ticking the gate on the PR.
- fixed by: nothing to fix in the run — the operator ticks **Spec approved** on #162, then
  re-runs `build repo-and-estate-views`.

### 2026-09-24 — Release's first code review read a stale local `main`

- what happened: `/code-review medium main...HEAD` reviewed every commit between the session's
  local `main` (58424b0, never updated after `git fetch origin main`) and the branch — the
  pipeline sync and #157/#158 included — and reported a finding in
  `.claude/hooks/vercel-env-hydrate.sh`, a file this PR does not touch.
- why: the review range named the local branch rather than `origin/main`; the fetch had only
  moved the remote-tracking ref.
- fixed by: re-running the review on `origin/main...HEAD`; the off-ticket finding, verified,
  parked as `triage/template-change-cloud-env-hydrate-unlinked.md`.

### 2026-09-24 — `main` moved under the run: #164 rewrote the same three files

- what happened: Release step 7(a) conflicted in `page.tsx`, `board-model.ts` and
  `tickets-board.tsx` — #164 moved run-only sections server-side and deleted `listSections` /
  `extraMaintenance`, which this run had extended for errored repos.
- why: a triage chore on the same surface merged while this run was in review; the cut had
  no way to see it.
- fixed by: 70d264c — main's files taken, this run's changes re-applied; errored repos' launchers
  now ride as `unreadableMaintenance`. Reviewed again and CI re-run on the merged head.

## Learned rules

- Name the base as `origin/main` in every review or diff range (`/code-review … origin/main...HEAD`, `git diff origin/main...HEAD`): a cloud session's local `main` is never updated by `git fetch origin main`, so `main...HEAD` silently widens the review to commits already merged.
