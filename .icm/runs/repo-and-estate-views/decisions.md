# Decisions: repo-and-estate-views

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — no `scope.md`; the epic's breakdown decision 3 (the four detail kinds, the estate
  overview as the foot of level 0 on a phone) is the source.

## Made in this run

- D-1 — An errored repo's view is reached by tapping its row under "Couldn't be read" in the
  estate overview; it gets no list section, row or chip. Operator, Define 2026-09-24.
- D-2 — An errored repo's view shows everything a repo view does (client, the error in full,
  triage/sweep launchers, Open on GitHub); only the figures are omitted, being zero. Operator,
  Define 2026-09-24.
- D-3 — The overview's Blocked group is exactly the Blocked figure's set (same repo filter);
  rows carry the blocked reason and no swipe. Define's technical call.
