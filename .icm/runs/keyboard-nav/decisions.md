# Decisions: keyboard-nav

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — the epic has no `scope.md`; its breakdown's decisions 1 (every selection has a URL,
  changed client-side) and 8 (keyboard navigation on desktop is kept) are what this run implements.

## Made in this run

- D-1 — At list level 0 the cursor previews the row in the pane without writing the URL or
  drilling; `Enter` commits (`?b=` drills, `?r=` focuses the pane). Why: `?b=` is both level 1
  and the batch view, so a batch can't be selected at level 0 without drilling. Define, operator.
- D-2 — Arrow steps at level 1 replace the history entry; drill, back-out, repo commit, clear and
  filter change push. Why: back steps through levels, not every row passed. Define, operator.
- D-3 — `[`/`]` stop at All then each chip, wrapping at both ends, from any level; a filter that
  hides the selection clears `t`, `b` and `r`. Define, operator.
