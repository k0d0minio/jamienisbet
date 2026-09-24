# Failures: epic-view

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

### 2026-09-24 — Release's code review read a diff against a stale local `main`

- what happened: `/code-review` reported a finding in `.claude/hooks/vercel-env-hydrate.sh`, a
  file this branch never touched; the review's diff included commits already on `origin/main`.
- why: the cloud checkout's local `main` ref sat at 58424b0 while `origin/main` was at ecf46d0 —
  nothing in the session had fetched or fast-forwarded it, and the review diffed against it.
- fixed by: re-reading `git diff origin/main...HEAD` to scope the branch; the off-branch finding
  was verified and parked as `triage/template-change-env-pull-unlinked.md`.

## Learned rules

- In a cloud session, scope every branch diff and review against `origin/main` after a fetch, never the local `main` ref, which is not kept current.
