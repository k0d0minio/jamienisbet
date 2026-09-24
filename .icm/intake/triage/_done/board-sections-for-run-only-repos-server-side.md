# Stub: readBoard() should emit a section (and a structured stage) for run-only repos

- lane: chore
- found-by: master-detail-shell / Release code review · 2026-09-24
- complexity: medium

## Problem

`lib/tickets.ts` `listBoard()` drops repos whose only open item is a run, so the master–detail
board (`components/board-model.ts` `listSections`) rebuilds their section client-side and
re-sorts every section with a copy of the server's `sectionUrgency`; `app/(app)/tickets/page.tsx`
builds their maintenance launchers separately (`extraMaintenance`). A run row's stage is also
re-parsed from the display string in `meta` (`board-ticket-row.tsx` `runStage`). master-detail-shell
kept `lib/tickets.ts` untouched by spec, so the rule now lives in two places.

## Proposed change

Have `readBoard()` return a section for every repo with open items (runs included, In flight as
a batch, maintenance built) and a structured `runStage` field on run tickets; delete the client
copies (`urgency`, `extraMaintenance`, `runStage`).
