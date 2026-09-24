# Plan: epic-view

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **The read** — `websites/admin-dashboard/lib/tickets.ts`: in the tree walk, record
   `breakdown.md`'s `{epic, sha}` instead of `continue`; fetch it via `fetchBlob` in the same
   `Promise.all` as the stubs; carry a `Map<epic, string | null>` out of `fetchRepoTickets`
   alongside the tickets and into `assembleBatches`; add `breakdown: string | null` to `Batch`
   (null for triage/backlog) and to whatever `readBoard()` serializes; update the header comment's
   CONTENT clock. — done when: typecheck passes and the `Batch` a board read returns carries the
   raw breakdown for an epic that has one.
2. **The model** — `components/board-model.ts`: `ListBatch` carries `breakdown` (null for the
   In flight pseudo-batch). — done when: every `ListBatch` construction compiles.
3. **The view** — `components/board-views.tsx`: replace `BatchView` with the epic view (summary
   line, `Meter`, action row with `CopySplitButton` fed `batch.next`'s pick-up/launches +
   Recut + GitHub, the stub list as `BoardTicketRow`s selecting `?t=`, the breakdown through the
   dynamic `Markdown` with the leading `# ` line stripped, or the footnote). Expose the pieces
   (header, list, actions+breakdown) so the phone can order them differently. — done when: the
   desktop pane renders the spec's order for an epic, Triage and In flight.
4. **The phone level 1 and `pane=1` retirement** — `components/tickets-board.tsx` (`BatchList`,
   the `batch` pane case), `components/use-board-params.ts`: level 1 renders back row, header,
   stub list, then actions + breakdown (below `lg` only — the list column keeps today's level 1
   at `lg`+); remove the summary row, `onOpenBatch`, the batch `pushed: params.pane` case and
   `pane` from `SELECTION_KEYS`/`BoardQuery`; drop a stale `pane=1` with `replaceState`. —
   done when: `grep -rn "pane" components/use-board-params.ts` shows no selection flag and a
   cold `?b=…&pane=1` loses the flag.
5. **Docs in code** — header comments in `use-board-params.ts`, `board-views.tsx`,
   `tickets-board.tsx` stop describing the summary row and the placeholder. (The app README's
   Tickets paragraph is Release's to update.) — done when: no comment mentions `pane=1` or a
   summary row.

## Risks

- **Payload growth** — every epic's breakdown now rides in the board payload. Signal: the
  `/tickets` RSC payload grows by more than the sum of breakdown sizes, or a breakdown is rendered
  on the server. Keep it raw and render only in the open view.
- **Cache regression** — a breakdown read that bypasses `gh()` (path read, no `force-cache`)
  re-reads every minute. Signal: any new `fetch(` in `lib/tickets.ts` outside `gh()`.
- **Desktop duplication** — the stub list in the pane and level 1 in the list column must share
  one active highlight; a selection from the pane must not reset the list column's scroll.
- **Back behaviour on phone** — removing the pushed batch view changes the parent of a ticket
  (`parent: { b: … }` now lands on level 1, not a pushed view); check the back bar and edge swipe.
