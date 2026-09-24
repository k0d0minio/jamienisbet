# Decisions: board-client-state

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — no scope.md for this epic; the breakdown's decisions 4 and 7 are the source (`.icm/intake/tickets-master-detail/breakdown.md`).

## Made in this run

- D-1 — Selection: the URL-state hook reads/writes `repo` and `t`; only `repo` is wired to UI this run (stub 2 wires `t`). Operator, Define.
- D-2 — "As of HH:MM" is the server `listBoard()` return time, Europe/Lisbon. Operator, Define.
- D-3 — The silent on-return re-read busts only the position reads (a second cache tag on the repo-tree calls); the manual refresh still busts everything. Operator, Build → spec revised (spec gap: stale-while-revalidate made the un-busted re-read a no-op).
