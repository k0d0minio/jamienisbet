# Failures: launcher-dropdown

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

### 2026-09-23 — the terminal launch link shipped live without ever being tried

- what happened: Build made "Claude Code (terminal)" a live menu entry (and the old UI had it as
  a link); the operator's smoke found it opened nothing. The spec was revised to copy-first with
  the terminal target parked, costing a revise and a second Build pass.
- why: the target's link shape was documented, and documented was treated as working — nobody
  had tapped a `claude-cli://` link from the board (browser tab or installed PWA) before it was
  made reachable.
- fixed by: the `parked` field on `LaunchTarget` and copy as every control's default action;
  `triage/claude-terminal-link-opens-nothing.md` carries the fix.

## Learned rules

- A launch target (or any custom URL scheme) is added `parked` until the operator has tapped its link from the board itself — browser tab and installed PWA — and reported that it opened; a documented link shape is not proof it works.
