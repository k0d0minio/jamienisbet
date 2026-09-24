# Failures: board-client-state

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

### 2026-09-24 — Define specced a silent re-read that could never see fresh data

- what happened: the approved spec said the on-return re-read "does not bust the tag — it
  takes whatever the normal cache clocks give". At Build that turned out to make the re-read
  a no-op: Next's fetch cache answers an expired `revalidate` entry with the stale value and
  refreshes it in the background, so after ≥5 minutes away the first read re-shows the old
  board while the "as of" stamp claims a fresh time. Build STOPped before the first edit.
- why: Define reasoned about the cache clocks as "at most a minute behind" without checking
  what a read past the window returns (stale-while-revalidate, not a blocking re-fetch).
- fixed by: `revise` at Build — the position (repo-tree) reads get a second cache tag and the
  silent re-read busts only that tag (operator's choice, 2026-09-24); Spec approved re-opened.

## Learned rules

- A time-revalidated fetch in the admin dashboard is stale-while-revalidate: the first read past its window returns the old value, so any "refresh" or freshness claim must bust a tag (`updateTag`) rather than rely on the clock having lapsed.
