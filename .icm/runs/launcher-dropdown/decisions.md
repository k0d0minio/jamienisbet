# Decisions: launcher-dropdown

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- <D-n — the decision, one line, as the scope worded it>

## Made in this run

- <D-n (the next free id) — the decision, why, which stage made it. A decision Build had to
  make is a spec gap: say so in `notes.md` → Notes for Release>

## Revised 2026-09-23 (operator, after smoke)

- The terminal link opened nothing. Copy becomes the default action everywhere (ticket split
  button, row taps, swipe-right); every tool link moves into the menu.
- The standalone Copy button merges into the split button's primary half.
- The terminal target stays in the menu, disabled ("Not working yet"), via a registry-level
  parked field; a triage bug stub carries the fix.
