# Decisions: master-detail-shell

The `D-n` ids this run rests on, mirrored from the scope's Decisions table
(`_shared/scope-template.md` → `D-n` ids are permanent), plus any the run itself had to make.
`validate-decisions.sh <slug>` traces the scope's ids into `spec.md` and `notes.md`; this file
is the run's own ledger, so a session need not open the scope to know what was settled and a
decision made mid-run has one home.

## From the scope

- none — the epic has no `scope.md`; its settled decisions are the breakdown's numbered list
  (`.icm/intake/tickets-master-detail/breakdown.md` → Decisions 1–8).

## Made in this run

- D-1 — Runs in flight get an "In flight" row per repo section at level 0 (shown only when
  non-empty), drilling to the repo's runs; it replaces the retired Now strip as their home.
  Operator, Define, 2026-09-24.
- D-2 — On a phone, level 1 opens with an epic summary row that pushes the full-screen epic
  view, then the ticket rows; on desktop the batch fills the pane. Operator, Define, 2026-09-24.
- D-3 — Selection URL keys: `?t=<repo>/<ticket.id>`, `?b=<repo>/<batch-slug>` (`runs` for
  In flight), `?r=<repo>` — one at a time, `?repo=` independent; unresolvable selections fall
  back (ticket → batch → none) with `replaceState`. Define, 2026-09-24.
- D-4 — Until stubs 3–5 land, the epic / repo / overview slots carry today's content as is
  (Copy next / Recut / GitHub; client link + maintenance launchers; figures, read errors,
  Estate check, footnote) so nothing reachable today is lost. Define, 2026-09-24.
- D-5 — A batch's epic view is pushed on a phone by `?b=<repo>/<batch>&pane=1`; `pane` is
  ignored from `lg`, where the pane always shows the selected batch. The spec made the phone
  summary row push the view but gave that pushed state no URL; a flag keeps it deep-linkable
  and on the history stack without a fourth selection key. Build, 2026-09-24 — a spec gap,
  noted for Release.
- D-6 — A repo whose only open work is a run has no server section, so the client adds one
  (In flight row only) and `tickets/page.tsx` builds its maintenance launchers with
  `repoMaintenanceLaunchers` — `lib/tickets.ts` stays untouched. Section order is recomputed
  client-side with the server's own urgency key, which reproduces the server order and slots
  run-only repos in. Build, 2026-09-24.
