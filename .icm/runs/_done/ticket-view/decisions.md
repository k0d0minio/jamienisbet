# Decisions: ticket-view

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — this epic has no `scope.md`; its settled decisions are the breakdown's numbered list
  (`intake/tickets-master-detail/breakdown.md`, decision 5 governs this run).

## Made in this run

- D-1 — The summary line drops the ticket id (Jamie, Define, 2026-09-24).
- D-2 — A blocked ticket's reason is said once, on the summary line; the metadata table drops its
  Blocked / Waiting on row (Jamie, Define, 2026-09-24).
- D-3 — Status labels are the board's own (Today / In flight / Blocked / Next / Queued), not the
  stub's "Open" (Define — one vocabulary with the list rows).
- D-4 — The summary line is the pane's subtitle for a ticket selection, replacing today's
  `repo · status · id` subtitle (Define).
