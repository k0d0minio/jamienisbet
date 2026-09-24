# Chore: board-run-sections-server-side

- invariant: no user-facing behaviour changes for the operator — the tickets board renders the
  same repo sections, in the same urgency order, with the same maintenance actions and the same
  run-stage labels. Only where that shape is computed moved: from the client
  (`components/board-model.ts`) to the server (`lib/tickets.ts`'s `readBoard()`), closing the gap
  master-detail-shell's Release review flagged — `lib/tickets.ts` stayed untouched by that spec,
  so the "does this repo get a section" rule lived in two places.
- change: `lib/tickets.ts`: `assembleBatches()` now folds a repo's runs in flight into an "In
  flight" pseudo-batch (`kind: "runs"`) the same way it already folds epic/triage/backlog
  batches, so `listBoard()`'s `section.batches.length > 0` filter and `sectionUrgency()` see
  every repo with open work — runs included — without a second pass. `readBoard()` already built
  maintenance launchers for every section it returns, so a run-only repo gets them for free once
  it has a section. `RepoSection.open` and `sectionUrgency()` exclude the new "runs" batch from
  their counts, preserving the split the client used to draw by hand (a run in flight is already
  picked up, so it isn't "open" work waiting to be picked). Also added a structured
  `Ticket.runStage` field (`"build" | "release" | "lane" | null`) alongside the existing "Stage"
  meta line, so a run ticket's stage is a value a component can switch on instead of a string to
  re-parse.
- change: `components/board-model.ts`: deleted `urgency()` (the client's re-derivation of
  `sectionUrgency`) and `listSections()` (the client-side construction of the In flight batch and
  the merge of `extraMaintenance`) — the server's `board.sections` now carries both, in order.
  `ListSection`/`ListBatch` are now plain aliases of `BoardSection`/`BoardBatch` rather than a
  reshaping of them.
- change: `components/tickets-board.tsx`: consumes `board.sections` directly instead of
  `listSections(board, extraMaintenance)`; dropped the now-unused `useMemo` import.
- change: `app/(app)/tickets/page.tsx`: deleted the `extraMaintenance` computation (the
  `board.strip` scan for run-only repos and the `repoMaintenanceLaunchers()` call per one) — no
  longer needed now that `readBoard()`'s own sections cover those repos.
- change: `components/board-ticket-row.tsx`: a run row's trailing label now looks up
  `RUN_STAGE_LABEL[ticket.runStage]` instead of finding the "Stage" meta line and regex-stripping
  its `" (the operator merges)"` suffix.
- rollback: revert the commit — a pure move of existing logic from client to server plus one new
  field on the wire; no schema or data effect.
- learned: none.
