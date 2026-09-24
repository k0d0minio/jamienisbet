# Decisions: epic-view

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — this epic has no `scope.md`; its source is
  `.icm/intake/tickets-master-detail/breakdown.md` decisions 3 and 8.

## Made in this run

- D-1 — Define: on a phone the epic view *is* list level 1; the shell's summary row and the
  `pane=1` flag retire, and a stale `pane` is dropped with `replaceState`.
- D-2 — Define: Triage, Backlog and In flight share the batch view, without Recut and breakdown.
- D-3 — Build: `BoardBatch.next` gains the next ticket's `id`, so the view reaches that ticket's
  launch targets for the split button without shipping a second copy of it (implementation
  detail inside the spec, not a gap).
- D-4 — Build: `pane` is not a selection key in `useBoardParams`: any new selection clears it,
  but `{ pane: null }` alone leaves the selection standing — otherwise correcting a stale flag
  would have wiped the very selection it rode with (implementation detail, not a gap).
