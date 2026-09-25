# Failures: work-phone

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

### 2026-09-25 — the approved spec prescribed a motion the desk tier forbids

- what happened: spec §5 asked for "a short linear slide" on push and pop; `design-dna`
  (loaded at Build) says the desk tier has no slides.
- why: Define read the mockup and the scope's D-3 ("no spring motion") but not the per-turn UI
  checklist, which is stricter than D-3.
- fixed by: D-44 — instant push/pop, the swipe follows the finger; named for Release.

### 2026-09-25 — the plan left open where a level scrolls

- what happened: plan pass 3 said "per-level scroll restore" and the risk list assumed the
  launch bar inside the reader's own scroll container; that would have broken pull-to-refresh,
  which listens to the window.
- why: Define planned from the old `board-pane.tsx` (a fixed, self-scrolling pushed view) without
  checking what the shell's pull-to-refresh needs.
- fixed by: D-45 — the page scrolls; scroll kept per level key; plan.md rewritten.

### 2026-09-25 — the review caught a back loop and an edge strip that ate touches

- what happened: `/code-review` at Release — from a cold deep link, back on the reader pushed
  the epic, whose back stepped history into the reader again, forever; and the 16px
  `touch-none` edge overlay swallowed vertical scrolls and taps that started under it.
- why: `pop` stepped back whenever the board had pushed the entry, whatever that entry was; the
  swipe was ported from the old pushed view's overlay without asking what sits under it.
- fixed by: back steps history only into a level no deeper than the current one (`depth` in
  work-phone.tsx); the swipe became native, non-passive touch listeners on the level itself.

## Learned rules

- A spec for an admin screen names motion only after reading `.claude/skills/design-dna/SKILL.md` → Motion: the desk tier is instant or a ≤120ms colour change, never a slide.
- In the admin dashboard, a phone screen scrolls the window, not a container of its own: pull-to-refresh (`components/pull-to-refresh.tsx`) listens to the page scroll.
- In the admin dashboard, an in-app back that uses `history.back()` must first check the entry behind it is not deeper than the current level — a pushed parent over a cold link otherwise loops the two.
- In the admin dashboard, an edge-swipe gesture listens on the view itself (non-passive `touchmove`, decided after a slop), never through a `touch-none` overlay, which eats the taps and scrolls under it.
