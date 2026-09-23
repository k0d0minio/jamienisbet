# Decisions: model-effort-preselect

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — this epic has no `scope.md`; the breakdown's decisions 1–6 (`intake/session-launchers/breakdown.md`) stand in for it.

## Made in this run

- D-1 — Spike run in Build by Jamie's hand test (Define, operator's answer). Result 2026-09-23, Jamie's words: "they open in the right repositories, but model, effort, mode and cloud environment is not added or opened accurately". Recorded as: `repo` honoured; `mode=code` not reflected; `model`, `effort`, `environment` ignored (none broke the link). So `supports.model` / `supports.effort` stay false on both targets and nothing new is wired.
- D-2 — Verb pick-ups follow the pipeline's own tiering (`new` → deep, executor verbs → balanced); prompt bodies use the stub's table (Define, operator's answer).
- D-3 — Recommendation shown on the ticket detail only; that is the batch sheet's surface too, since the sheet has no Start button of its own — every Start in it is a `TicketDetail` (Build; a reading of the spec, not a gap).
- D-4 — `mode=code` is still sent although it was not seen to take effect: it is the documented value, and the spec asks for it explicitly (Build).
- D-5 — The spike was reported per parameter, not per surface; the README table is per parameter on `claude.ai/code/new` and does not claim a surface breakdown it does not have (Build).
