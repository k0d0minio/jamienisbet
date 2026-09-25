# Plan: work-phone

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

Rewritten by Build (2026-09-25) where reality disagreed: the levels scroll with the page, not in
their own containers (D-45); push and pop are instant (D-44); two more files the old board alone
used were deleted (`launch-menu.tsx`, `repo-maintenance.tsx`).

1. **The model and the URL — `work-model.ts`, `use-board-params.ts`** — `REPOS_VIEW` (`?v=repos`
   read as Up next at the desk, never rewritten); `phoneLevel` / `phoneQuery` / `phoneParent` /
   `phoneLabel` / `phoneLevelKey` / `epicNextLine`; repo-list headings carry their batch key;
   `canonical()` treats a lone `?v=next` as `/`; `pop(parent)` = `history.back()` when the board
   pushed the entry, else a push of the parent; `pushedFromQuery()`. — done: 92f6b50.
2. **The shared reader parts — `ticket-reader.tsx`** — `ReaderHead compact` (no GitHub, no
   action row), `ReaderBody stacked`, `ReaderLaunchBar` (the desk's primary-act rules, 44px
   controls), `DeskCopyButton` `keys`/`className`, `understood` exported. Desk output unchanged.
   — done: 92f6b50.
3. **The phone layout — `components/work-phone.tsx`, `globals.css` `bottom-tabs`** — list level
   (title bar, sticky switch, Up next sections, Repos), repo, epic and reader levels, back bar,
   edge swipe, scroll kept per level in the window scroll, launch bar sticky on the tab bar. —
   done: 92f6b50; proof is the preview after the ready flip.
4. **Swap and delete — `page.tsx`, `work-desk.tsx` (+ `BatchSummary`), comments** — the phone
   slot renders `WorkPhone` / `WorkPhoneNotConfigured`; deleted `tickets-board`, `board-pane`,
   `batch-row`, `board-ticket-row`, `ticket-detail`, `board-views`, `ticket-look`, then
   `launch-menu` and `repo-maintenance` (orphaned by the same deletion); `board-model.ts`
   pruned of the level-0 cursor helpers. — done: 92f6b50, adfc3d1.
5. **Docs — `websites/admin-dashboard/README.md`** — the phone section rewritten, the swipe and
   split-button lines, the file tree. — done: adfc3d1.

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
