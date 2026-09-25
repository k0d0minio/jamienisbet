# Failures: lead-profile-columns

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

### 2026-09-25 — j / k read a stale list order on a profile the list never opened

- what happened: Release's code review found that a profile opened from the Inbox or the palette
  still showed "N of M" and stepped through whatever list order was last stored in the tab —
  against the criterion "opened from anywhere else, j / k do nothing".
- why: Build assumed "not in the stored order" was the whole test for "not opened from the
  list"; any lead that *was* in an old order passed it.
- fixed by: the list records the lead a click opens (the origin) and j / k re-record it; the
  profile honours the order only when the origin is itself (Release, on this branch).

## Learned rules

- In the admin dashboard, state one screen leaves in session storage for another must also record how the second screen was reached, and be honoured only on that path — presence in storage is not proof the user came from there.
