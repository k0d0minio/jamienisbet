# Failures: inbox-rebuild

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

### 2026-09-25 — an optimistic clear ran on a refusal the client already knew

- what happened: Release's code review found that `s` on a dated outreach row with no step
  hid the row, moved the selection and closed an open form, then the server refused and the
  row came back with the selection elsewhere.
- why: every clear went through the one optimistic path, including a case whose outcome the
  row's own data already decided.
- fixed by: `hasStep` on the row; the refusal is a toast before any write (Release commit).

## Learned rules

- In the admin dashboard, decide any refusal the row's own data already knows before an optimistic removal; only an outcome the server alone can know may roll a row back.
