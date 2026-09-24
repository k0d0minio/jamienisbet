# Failures: master-detail-shell

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

### 2026-09-24 — the spec gave the phone's pushed epic view no URL

- what happened: the spec made the phone's level-1 summary row push the epic view, but every
  URL key it defined (`t` / `b` / `r`) already meant something else for a batch on a phone
  (level 1, no pushed view); Build had to add `&pane=1` (D-5).
- why: Define settled the phone behaviour and the URL keys as separate questions and never
  walked a phone state through both.
- fixed by: b2733cc (D-5 in decisions.md, flagged in Notes for Release).

### 2026-09-24 — Release review caught five in-ticket defects Build's self-check missed

- what happened: the page scroll lock ignored a rotation across `lg`; the In flight row dropped
  the today dot of a run picked for today; the edge-swipe strip covered the back button's
  leading edge; the pane reused one ticket's controls (a "Copied" state) for the next; a dead
  `active` prop on `BatchRow`.
- why: the pushed view and the pane share one element, and its edge cases (rotation, overlap,
  React reuse across selections) were reasoned about per width, not across the switch.
- fixed by: 408ce5a.

## Learned rules

- In the admin dashboard, never pass `window.history.state` (or any object carrying Next's
  `__NA`) to `history.pushState`/`replaceState`: the App Router then treats the call as its own
  and skips syncing `useSearchParams`, so URL-state views stop re-rendering — pass only your own
  keys (or `null`).
- When one element renders two layouts by breakpoint (a pane from `lg`, a pushed view below),
  key its content to the selection and make any side effect it applies (a scroll lock, a
  listener) re-read the breakpoint on change, not once on mount.
