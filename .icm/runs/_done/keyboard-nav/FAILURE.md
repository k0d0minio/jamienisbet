# Failures: keyboard-nav

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

### 2026-09-24 — Release review caught two in-ticket defects in the cursor Build self-checked

- what happened: the level-0 keyboard cursor (client state) kept overriding the URL selection
  after the URL moved without the keyboard — a Blocked/repo link in the overview, the browser's
  back/forward — so `c`/`o` acted on a batch the pane wasn't showing; and `Enter` on an
  already-selected stub queued a pane focus that waited for a re-render nothing triggered.
- why: Build reasoned about the cursor only along the keyboard's own paths, not every route by
  which the URL (the board's source of truth) changes; and treated "apply focus after the next
  render" as always followed by a render.
- fixed by: the Release fix commit (cursor records the selection it was set under — `at`,
  compared with `selectionKey` — and is ignored once the URL moves; a no-op Enter focuses the
  pane directly).

## Learned rules

- In the admin dashboard's URL-state screens, any client state that overrides what the URL selects must record the selection it was set under and be ignored once the URL has moved on (back/forward, links), so the URL always wins.
