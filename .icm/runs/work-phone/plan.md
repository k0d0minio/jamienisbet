# Plan: work-phone

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **The model and the URL — `work-model.ts`, `use-board-params.ts`** — add the phone's reading
   of the shared selection: `?v=repos` as a list value (at the desk `resolveWork` maps it to Up
   next and does not rewrite it); a pure `phoneLevel(selection)` → `list(next|repos, scrollTo?)`
   | `repo` | `batch` | `reader(parent)` and `parentQuery(level)` for the cold-link back; a back
   label per level; `?v=today|running|blocked` → Up next with a section to scroll to, no rewrite;
   `?repo=` → `?r=` rewrite. Segment switch goes through `replaceState`. Nothing here renders. —
   done when: every URL in spec §5 maps to exactly one level and parent, and the desk resolves
   each the way it did before (plus `v=repos` → Up next).
2. **The shared reader parts — `ticket-reader.tsx`** — split the action row out of `ReaderHead`
   into a `ReaderActions` (primary-act rules unchanged: Launch / Copy-primary when too long /
   running line on an open PR / resume on a run folder) that takes a `layout: "desk" | "bar"`;
   the side column renders in flow under the body when told to (the container query already
   stacks it — make it explicit for the phone). Desk output byte-for-byte the same. — done when:
   the desk reader at 1280px is visually unchanged and the phone can compose head + body + side
   column + `ReaderActions` in one column.
3. **The phone layout — new `components/work-phone.tsx` (+ `globals.css` only for what tokens
   can't say)** — title bar (title, as-of, refresh, search), the sticky `SegmentedControl`, the
   Up next sections and the Repos list (repo headers → `?r=`, epic / Triage / Backlog rows →
   `?b=`), the repo level (grouped open tickets, `RepoMaintenance`, error), the epic level (every
   stub; done rows inert), the reader with the sticky launch bar above the tab bar and its
   safe-area padding where there is no tab bar (`md`+); per-level scroll restore; the edge-swipe
   pop (port the threshold and pointer handling from `board-pane.tsx`, desk-tier surfaces, linear
   slide, none under reduced motion) and the named back button through `useBoardParams`' prev
   mechanism. Rows are `ListRow`-based two-line rows, taps only. — done when: at 390×844 every AC
   from the list level to the launch bar holds on the preview.
4. **Swap and delete — `app/(app)/page.tsx`, `work-screen.tsx`, `use-desk.ts`, `work-desk.tsx`**
   — render `WorkPhone` in `WorkScreen`'s phone slot; move `BatchSummary` beside `work-desk.tsx`
   (or into `work-views.tsx`); delete `tickets-board.tsx`, `board-pane.tsx`, `batch-row.tsx`,
   `board-ticket-row.tsx`, `ticket-detail.tsx`, `board-views.tsx`; prune `ticket-look.ts` /
   `board-model.ts` to what a live file imports; fix the comments that name the old board. —
   done when: no import of a deleted file remains, `grep` finds no `Material` / `Grouped*` import
   under Work's tree, and CI's typecheck and lint are green.
5. **Docs — `websites/admin-dashboard/README.md`** — rewrite "Under `lg` — the phone board" for
   the new levels, the `?v=repos` value and the phone's reading of desk links; drop the chip-rail
   and swipe-tray lines. (Release owns the final README pass; Build keeps this paragraph true.) —
   done when: the README describes what shipped and names no deleted file.

## Risks

- **Edge swipe vs Safari's own back swipe.** In a Safari tab the browser's edge swipe may fire
  alongside ours. Signal: a double pop on the preview in Safari. Mitigation: ours only pops via
  `history.back()` / the same push, so both land on the same entry; if they stack, start the
  gesture a few px in from the edge and ignore touches Safari claims (`touchstart` defaultPrevented).
- **Sticky bar and iOS viewport.** `position: sticky`/fixed plus the dynamic toolbar and the
  keyboard can misplace the bar. Signal: the bar floating mid-screen or hidden under the tab bar
  on the preview in standalone and in Safari. Mitigation: bar inside the reader's own scroll
  container, `env(safe-area-inset-bottom)` only where there is no tab bar, `dvh` units.
- **Deleting shared pieces.** `board-model.ts` / `ticket-look.ts` are imported by the desk too.
  Signal: typecheck red. Mitigation: prune by importer, not by guess; pass 4 runs last.
- **Desk regression through `?v=repos`.** The desk's in-place rewrite of unknown `v` would eat it.
  Signal: rotating an iPad loses Repos. Mitigation: pass 1 whitelists `repos` in the desk
  resolver as Up next without a rewrite.
