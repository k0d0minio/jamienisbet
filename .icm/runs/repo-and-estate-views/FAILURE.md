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

## Learned rules

- <one sentence, imperative, general enough to apply to the next run in this repo>
