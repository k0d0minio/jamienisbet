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

## Learned rules

- A spec for an admin screen names motion only after reading `.claude/skills/design-dna/SKILL.md` → Motion: the desk tier is instant or a ≤120ms colour change, never a slide.
- In the admin dashboard, a phone screen scrolls the window, not a container of its own: pull-to-refresh (`components/pull-to-refresh.tsx`) listens to the page scroll.
