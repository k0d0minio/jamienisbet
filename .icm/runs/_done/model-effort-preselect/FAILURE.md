# Failures: model-effort-preselect

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

### 2026-09-23 — the hand test came back without the per-surface split the spec asked for

- what happened: acceptance criterion 6 asked for a surface × parameter table; the operator's report was one sentence covering every surface, so the README table is per parameter and the criterion shipped unticked (accepted by the Ready-to-merge tick).
- why: Build's request listed the URLs by surface but asked for a free-form reply, so nothing forced the per-surface shape.
- fixed by: recorded as decisions.md D-5; the README table claims no surface split it does not have.

## Learned rules

- When a criterion needs an operator's hand test, ask for the result in the criterion's exact shape (e.g. one line per surface × parameter), not a free-form reply.
