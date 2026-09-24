# Failures: ticket-view

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

### 2026-09-24 — Build could not tick the met acceptance criteria on the PR

- what happened: the PR-body edit that ticks criteria was denied by the session's permission
  layer; the criteria stayed unticked on #161.
- why: a direct REST PATCH of the PR body from a script is treated as an external write needing
  the operator's allowance.
- fixed by: tick state recorded in `03_build/output/notes.md`; the operator ticks on the PR.

### 2026-09-24 — the Release code review read the stale local `main`

- what happened: `/code-review main...HEAD` covered already-merged work (the master–detail shell,
  the launcher registry, a template sync) and reported a finding outside this branch.
- why: the cloud checkout's local `main` ref predates several merges; only `origin/main` is fetched.
- fixed by: confirmed the branch's own diff with `git diff origin/main...HEAD`; the stray finding
  was parked as a template change request, not held against the merge.

## Learned rules

- Review a branch against `origin/main...HEAD`, never the local `main` ref — in a cloud checkout
  local `main` is stale, and the review then reads (and reports on) work already merged.
