# Build notes: epic-view

- commits: 4b16c08 (breakdown read), ca99f0d (epic view + phone level 1), then run files
- ci: GREEN on 4f0579d (full gate, ready) — cheap tier GREEN on 4b02c9d

## What changed

- `websites/admin-dashboard/lib/tickets.ts`: the tree walk records each epic's `breakdown.md`
  (pseudo-batches skipped) and reads it through `fetchBlob` in the same `Promise.all` as the
  stubs — by blob SHA, month clock, `force-cache`, board tag, concurrency cap; no new tree call,
  no path read. `fetchRepoTickets` returns `breakdowns` beside its tickets; `readEstate` keeps
  them per repo; `assembleBatches` puts the raw markdown on `Batch.breakdown` (null when absent
  or unreadable, always null for triage/backlog). `BoardBatch.next` gains `id`. Header comment:
  the CONTENT clock names breakdowns; the `readBoard` note names them as raw markdown.
- `components/board-model.ts`: In flight's pseudo-batch carries `breakdown: null`.
- `components/board-views.tsx`: `BatchView` is now the epic view — `BatchMeter`,
  `BatchActions` (Copy next as the ticket's `CopySplitButton` on a `GroupedRow` accessory, fed
  the next ticket's pick-up and launches, the row naming the stub and its recommended model;
  Recut on epics; Open on GitHub), `BatchTickets` (level-1 rows, moved here from the board with
  their header copy), `BatchBreakdown` (the dynamically imported `Markdown`, leading `# ` line
  stripped; "No breakdown.md in this epic." when null; nothing for pseudo-batches). `BatchSummary`
  is the shared scan line (repo · `N of M` done · N open / in flight).
- `components/tickets-board.tsx`: phone level 1 is the view — back row, title + scan line +
  meter, tickets, then actions + breakdown (the phone-only parts `lg:hidden`); the summary row
  and `onOpenBatch` are gone; a batch is never pushed. The pane's batch case renders
  `BatchView`, a stub tapped there selects that ticket. A URL still carrying `pane` is corrected
  in place.
- `components/use-board-params.ts`: `pane` retired — returned only as `stalePane`, cleared by
  any selection, and clearing it alone leaves the selection (D-4).
- `components/batch-row.tsx`: `BatchLine` is no longer exported (nothing outside uses it).

## Acceptance criteria status

- [x] Breakdown rendered without its `# ` line, `## Build order` kept — `BatchBreakdown`.
- [x] By blob SHA through `fetchBlob` from the existing tree read; one blob per breakdown cold,
      none warm (same content-clock cache as stub bodies).
- [x] Missing / unreadable breakdown → the footnote, no board error; pseudo-batches show neither.
- [x] Desktop pane order: title, scan line, meter, actions, stub list, breakdown.
- [x] Copy next = the next ticket's `CopySplitButton` (its pick-up, its launches), row names the
      stub; absent without a pick-up.
- [x] Recut on epics only, unchanged launcher; GitHub opens the batch / runs folder.
- [x] Pane stub list uses `BoardTicketRow` (look, highlight, swipes); a tap writes `?t=`.
- [x] Phone level 1 order as specified; no summary row, no pushed batch view.
- [x] `?b=…&pane=1` cold → level 1, `pane` dropped by `replaceState`; nothing writes `pane`.
- [x] Back from a ticket returns to level 1 with its scroll — the level key does not change
      between a batch and its ticket, so the list's scroll is never reset (unchanged mechanism).
- [x] No `force-dynamic`; every new read goes through `gh()`/`fetchBlob`; header updated.
- [ ] Preview checked on phone + desktop, light + dark — the operator's smoke.
- [x] CI green — full gate GREEN on 4f0579d.

## Notes for Release

- The admin README's Tickets paragraph still describes the phone summary row and
  `&pane=1 pushes its view on a phone` — Release updates it (knowledge map: Release writes the
  READMEs a shipped change makes stale).
- On desktop the batch's tickets appear twice (list column level 1 and the pane) as the spec
  says; on a phone the hidden pane still renders the batch view under `hidden`, the same CSS-only
  split the shell uses for the overview — the breakdown's Markdown is therefore mounted twice.
- Lint and typecheck could not run locally (no `node_modules`); CI is the first read of both.
- Parked: `triage/template-change-sync-rules-multiline.md` — `run-pack.sh --sync-rules` truncated
  two of `master-detail-shell`'s learned rules in `_shared/project-rules.md`.

Context budget: Build read the shell's archived `FAILURE.md` to recover the two truncated learned
rules, and `packages/ui`'s `grouped-list.tsx` to fit the Copy next row to `GroupedRow`'s
accessory slot.

## Release

- gate: Ready to merge ticked — merge authorised
- ci: GREEN on 395338d before the reviews (full gate); re-read after the last push (see the stop
  report)
- reviews: code medium — no finding in this branch's diff (URL state, history back, launcher
  data, breakdown and blob reads checked); one finding outside it, in `.claude/hooks/
  vercel-env-hydrate.sh` already on `main` (the review diffed a stale local `main` — FAILURE.md),
  verified and parked · security security-check.sh --branch --audit: OK · /security-review n/a
  (no auth, payments, PII or route policy touched) · /production-readiness n/a (no DB, auth,
  payments or env var touched) · readiness env.sh audit --changed: OK
- parked: template-change-sync-rules-multiline.md (Build); the env-hydrate finding was already
  parked on `main` — added as evidence to template-change-cloud-env-hydrate-unlinked.md
- migrations: skip — none of this run's own
- learned: none kept — FAILURE.md's rule (review against `origin/main`) duplicated the one
  `repo-and-estate-views` landed on `main` first; its wording was kept at the merge of `main`
  (retrospective.sh: skip — no error.log)
- merge of main: 6 commits (ticket-view, repo-and-estate-views, board-run-sections-server-side,
  fix-board-runs-slug-collides-with-epic, CI cost floor D43) — conflicts resolved in
  `lib/tickets.ts` (server-side runs batch gains `breakdown: null`, `assembleBatches` keeps the
  breakdowns argument), `components/board-model.ts` (main's: client-side runs batch gone),
  `components/board-views.tsx` (imports unioned, header comment merged), the admin README
  (main's repo / overview / ticket prose plus the epic view; In flight's URL slug is `_runs`),
  `_shared/project-rules.md` (main's rule)
- docs: websites/admin-dashboard/README.md § Tickets (master–detail paragraph: the epic view,
  phone level 1, `pane` retired; read-once paragraph: breakdowns) · announce: internal
