# Failures: retire-app-tier

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

### 2026-09-25 — the stub's `touches:` missed two thirds of the footprint

- what happened: the stub named ~12 files; an import and utility scan at Define found 28 files importing app-tier components and 31 using `app-*` utilities, including every lead edit sheet's form fields — which the desk tier had no controls for.
- why: the stub was cut before the screen stubs landed, from a guess at what they would leave behind.
- fixed by: Define measured it and asked four questions (Money, form controls, sheets, run size) before writing the spec (D-46..D-49).

### 2026-09-25 — the mechanical class rename rewrote a CSS custom property

- what happened: the regex that turned `spring-press` into `duration-100` also matched `var(--spring-header)` in `app/globals.css`, leaving `var(-- duration-100)`.
- why: the pattern was anchored on a word boundary, and `-` is a boundary.
- fixed by: the residue scan after the rename caught it; the view-transition block was rewritten by hand.

### 2026-09-25 — Build sized the new fields on the wrong step

- what happened: the desk fields went out on `min-h-desk-control` (30px) while the spec said 32px at the desk.
- why: the control step was the obvious token for a control; the spec was not re-read against it.
- fixed by: the self-check against the criteria moved fields and the select trigger to `min-h-desk-row` before the flip.

### 2026-09-25 — an audit fix created an overlap

- what happened: growing the sheet's close ✕ to 44px on touch put its target over the right end of a detented sheet's full-width grab handle — a tap meant to step the detent would close the sheet.
- why: the target was measured alone, not against what sits beside it.
- fixed by: Release's code review; the handle now stops 3rem short of each edge (30f00a7).

### 2026-09-25 — two tool frictions in the cloud session

- what happened: `/security-review` failed on `git diff origin/HEAD...` (no `origin/HEAD` in a fresh clone), and `next dev` wrote `AGENTS.md` and `CLAUDE.md` into `websites/admin-dashboard/`.
- why: a cloud clone does not set the remote's HEAD; Next 16's dev server generates agent files by default.
- fixed by: `git remote set-head origin main`; the generated files were deleted before any commit.

## Learned rules

- Measure a retirement's footprint with an import-and-utility scan at Define; never trust a stub's `touches:` guess for a sweep. (FAILURE.md — retire-app-tier)
- A mechanical class-rename regex runs on class tokens only — never over `var(--…)` names — and its residue is re-scanned before the commit. (FAILURE.md — retire-app-tier)
- When a touch target grows, check what it now overlaps (a sheet's ✕ against the detent handle), not only its own size. (FAILURE.md — retire-app-tier)
- In a cloud session, run `git remote set-head origin main` before `/security-review`, and delete the `AGENTS.md` / `CLAUDE.md` that `next dev` writes into `websites/admin-dashboard/` before committing. (FAILURE.md — retire-app-tier)
