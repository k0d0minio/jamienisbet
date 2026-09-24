# Plan: master-detail-shell

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Selection model + URL keys** — `websites/admin-dashboard/components/use-board-params.ts`
   (extend: `t` / `b` / `r`, one selection at a time — setting one deletes the other two;
   `select(kind, id)`, `clear()`, a `replace` variant for fallbacks via `replaceState`) and a
   pure resolver beside `tickets-board.tsx` (e.g. `components/board-selection.ts`):
   `resolveSelection(board, params)` → `{ kind: "ticket" | "batch" | "repo" | "none", repo,
   batch, ticket, listLevel: 0 | 1, stale: key | null, dropFilter: boolean }`, applying the
   spec's fallback (ticket → its batch → none), the `runs` pseudo-batch (tickets with
   `kind: "run"`, `batch: null`, grouped per repo) and the filter-conflict rule. The client
   root calls it and fires `replaceState` once when `stale`/`dropFilter` is set. — done when:
   the resolver is a pure function of `BoardData` + search params and the board still renders
   as today.
2. **The shell** — `components/tickets-board.tsx` + a new `components/board-shell.tsx` (or
   similar): `lg` grid (list column ~24rem, pane with its own `overflow-y-auto` and height
   bound to the viewport under the app chrome), phone single column with a pushed full-screen
   view (large title, back affordance, edge-swipe — reuse `swipe-row`'s pointer handling or a
   small hook; view transitions as `view-transition-link.tsx` does). Save/restore the list's
   scroll on phone around the push (sessionStorage or a ref keyed by list level). Back =
   `history.back()` when the previous entry is the board (track with a state marker passed to
   `pushState`), else push the parent. Check `AppScreen` for whether the masthead/large title
   can host the pushed view; extend `packages/ui` only if a primitive is truly missing. — done
   when: selecting swaps the pane on desktop and pushes on phone, with the list scroll kept.
3. **The drill list** — level 0: chip rail, refresh + as-of, repo sections (header = button
   selecting the repo), batch rows (epics, Triage, Backlog, In flight) rebuilt from
   `batch-row.tsx` minus its `Sheet`, keeping `SwipeRow` actions exactly; level 1: back row
   "‹ <repo>", phone-only epic summary row, ticket rows from `board-ticket-row.tsx` minus the
   in-place expansion (status dot, sequence, title, priority; swipes kept). Active-row
   highlight. — done when: every batch drills and every ticket selects.
4. **Pane views** — ticket: existing `TicketDetail`; batch placeholder: title, `N of M` +
   `Meter`, Copy next / Recut / GitHub (lift the sheet's launcher markup verbatim); repo
   placeholder: title, client link, the section's maintenance launchers (existing
   `repo-maintenance.tsx`); estate overview: the current masthead figures, error group,
   Estate check and footnote moved out of the board's top (phone: foot of level 0). — done
   when: nothing reachable today (Recut, maintenance, errors, Estate check) became unreachable.
5. **Retire + home + skeleton** — delete the Now strip, `ticket-peek.tsx`, the batch `Sheet`,
   the in-place expansion and any export left unimported (grep each); `app/(app)/page.tsx`
   `TodaysTickets` rows → `/tickets?t=<repo.slug>/<id>`, comment/footer copy without
   "now-strip"; `app/(app)/tickets/loading.tsx` redrawn (list column + empty pane at `lg`).
   — done when: grep finds no `TicketPeek`, `now-strip`, or orphaned export, and the draft CI
   tier is green.
6. **Verify on the preview** — flip ready, `ci-status.sh` → GREEN, then walk every acceptance
   criterion on the Vercel preview: phone + desktop, light + dark, cold deep links for `t`,
   `b`, `r` (+ `repo`), back/forward, a refresh with a selection open, swipes. — done when:
   every AC is ticked in the PR body by evidence, not assumption.

## Risks

- **History and `useSearchParams` drift** — `replaceState` fallbacks racing a `pushState` can
  leave the URL and the rendered selection disagreeing; signal: back/forward shows the wrong
  pane. Keep one writer (the hook) and resolve from the URL on every render, never from a
  mirrored `useState`.
- **Phone scroll restoration** — the pushed view unmounting the list loses its scroll; signal:
  returning lands at the top. Keep the list mounted (hidden) under the pushed view, or restore
  from a saved offset after the pop.
- **Edge-swipe vs row swipes** — the back edge-swipe and `SwipeRow`'s horizontal drag compete
  on phone; signal: a row swipe near the left edge pops the view. Scope the edge-swipe to the
  pushed view only (the list isn't under the finger there) and to a narrow edge band.
- **Pane height at `lg`** — `AppScreen`'s chrome decides the pane's scroll container; signal:
  the whole page scrolls instead of the pane. Settle the height model in pass 2 before
  building rows.
- **Orphaned code** — retiring the sheet and peek can leave `Sheet` imports or helper exports
  unused; lint catches unused imports, not unused exports — grep each removed name.
