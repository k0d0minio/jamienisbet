# Failures: shell-rail-palette

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

### 2026-09-25 — Release review found in-ticket defects Build's self-check missed

- what happened: `/code-review high` found six fixable issues: the palette's highlight kept a position rather than a row, so it moved when the index arrived; the palette navigated with `router.push` on Work; the shortcut listener crashed on autofill's key-less keydowns; the 56px rail padded the notch inset *inside* its width; the new-tab rule was restated instead of reused; the moved feed's h1 still said "Needs you".
- why: Build checked each criterion against its happy path and never walked the async load (the highlight), the board's own navigation idiom (pushState), or a notched landscape device.
- fixed by: `fix: shell-rail-palette — review findings` on the run branch, before the merge.

## Learned rules

- In the admin dashboard, a jump that only changes Work's board selection while already on `/` writes the URL with `window.history.pushState(null, "", href)`, never `router.push` — a router navigation re-runs the page and puts the skeleton back over the board.
- In the admin dashboard, fixed chrome sized by a token (the rail, the tab bar) grows by the safe-area inset it clears — width or height plus `env(safe-area-inset-*)` — and the content offset reads the same sum; padding the inset inside the token's size leaves no room for the items.
