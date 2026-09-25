# Stub: The desk reader and the phone detail parse a stub twice

- lane: chore
- found-by: release work-reader · 2026-09-25
- complexity: low

## Problem

`websites/admin-dashboard/components/ticket-reader.tsx` (the desk reader) and
`components/ticket-detail.tsx` (the phone board's detail) each carry their own `DependsOn`
link list and their own `## ` section splitter (`sections`/`readerParts` against
`splitPrompt`). The reader's splitter follows CommonMark fences (a fence closes only on a run of
the same character at least as long); the phone's still compares the first character alone. A
fix to one does not reach the other.

## Proposed change

Move the section splitter and `DependsOn` into one shared module (for example beside
`board-model.ts`) and have both surfaces import it. Best done with, or after, `work-phone`,
which rebuilds the phone detail.
