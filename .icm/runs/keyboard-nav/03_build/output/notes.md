# Build notes: keyboard-nav

- commits: feat: keyboard-nav — desktop keyboard map for the Tickets board
- ci: see status.md (settled by ci-status.sh after the ready flip)

## What changed

- `websites/admin-dashboard/components/use-board-keys.ts` (new): the one `document` keydown
  listener. Gated on `(min-width: 64rem)`; bails on text fields, an open menu/dialog/alertdialog
  (Radix mounts them only while open), Ctrl/Meta/Alt, Shift (except `?`), IME composition, an
  already-prevented event, and `Enter` on a native control (a Tab-reached row, link or `summary`
  keeps its own Enter). Maps keys to intents; the board executes them.
- `components/board-model.ts`: pure helpers — `levelZeroRows` (header then batches per visible
  section), `rowSelection` (a row resolved exactly as its URL would be, so preview and commit
  can't differ), `copyTarget` (the same value + toast noun the view's copy button uses),
  `githubUrl` (the same URLs the "Open on GitHub" rows use).
- `components/tickets-board.tsx`: the cursor. Level 0 keeps `{ key, preview }` in state (never
  the URL); the pane renders `preview ?? selection`. Level 1's cursor is the selected ticket, or
  after a keyboard drill the batch's first stub (`cursor1`). Arrow steps at level 1 call
  `correct` (replaceState, keeps the entry's "pushed from"), commits call `navigate`, back-out
  calls `back({ t: null })`. A back-out by any route lands the level-0 cursor on the batch left
  (render-phase adjustment on the level key). Focus hand-off after a drill/back-out waits for the
  right level to render (`pendingFocus`). `[`/`]` step `[All, ...chips]` with wrap.
- `components/board-refresh.tsx`: `requestBoardRefresh()` dispatches `jn:board-refresh`; the
  button listens and runs its own `onRefresh` unless pending — one refresh path, one pending
  state and stamp.
- `components/board-pane.tsx`: the scroller is `role="region" aria-label="Details"
  tabIndex={-1}` with the button focus ring; takes an optional `scrollerRef`.
- `components/batch-row.tsx`, `board-ticket-row.tsx`, `board-views.tsx` (`BatchTickets`): an
  optional `optionId` turns the row's button into `role="option"` with `aria-selected`, its `li`
  and `ul` into `role="none"`, and a scroll margin clear of the sticky title bar.
- `components/board-keys-sheet.tsx` (new): the `?` sheet (the design system's `Sheet`, grouped
  rows with mono keycaps); returns focus where it was on close. A `?` hint at the list foot,
  `lg` only.
- `components/ticket-look.ts`: `ACTIVE_ROW_DESKTOP`, `CURSOR_SCROLL_MARGIN`.
- `websites/admin-dashboard/README.md`: one paragraph on the keyboard map.

## Acceptance criteria status

- [x] Level-0 cursor walks headers + batch rows, pane previews, URL unchanged, clamps at ends.
- [x] Level-0 `Enter`/`→`/`l`: batch → push `?b=`, cursor on first stub, list focused; repo →
      push `?r=`, pane focused.
- [x] Level-1 steps replace with `?t=`, pane follows, row scrolled into view (`block: "nearest"`).
- [x] Level-1 `Enter` focuses the pane; arrows scroll natively there, `j`/`k` by 64px; `Esc`/`←`/
      `h` return to the list with the cursor unchanged.
- [x] `Esc` at level 1 → level 0 on the batch left; at level 0 clears the selection (and a
      preview) → overview; back after drill + arrows is one step (the replaced entries keep the
      drill entry's "pushed from").
- [x] `c` — same value and toast as the button; "Nothing to copy here" otherwise.
- [x] `o` — ticket file / batch folder / repo in a new tab (`noopener,noreferrer`).
- [x] `r` — the button's own refresh, via an event; cursor/selection/level are client state and
      URL, untouched by `router.refresh()`.
- [x] `[`/`]` — All + chips, wrapping; a hiding filter clears `t`/`b`/`r` (the existing
      `setFilter` already did: any selection key clears all three) and lands the cursor on the
      new view's first row.
- [x] `?` sheet — every key listed; Radix closes it on `Esc`; focus returns; no board key fires
      while it is open (a `dialog` is in the document).
- [x] Inert in text fields, open menus/dialogs, with Ctrl/Meta/Alt.
- [x] Below `lg` the listener returns at once. The level-0 cursor fill is `lg:` only, so a phone
      keeps no highlight on the row it came back from.
- [x] Listbox per level with `aria-activedescendant`; repos are `role="group"` at level 0;
      only the cursor row has `aria-selected="true"`. VoiceOver itself is unverified here.
- [x] A click sets the cursor (level 0 via `setCursor0`, level 1 via the selection); row
      buttons keep their tab stops.

## Notes for Release

- Two readings the spec left implicit, settled here: at level 0 after a back-out the cursor rests
  on the batch left **without** previewing it (the pane shows the overview until the next arrow);
  `Esc` at level 0 clears a preview as well as a URL selection. At level 1 after a keyboard drill
  the first `↓` selects the *second* stub (the cursor started on the first, previewing the batch
  view); `↑` or `Enter` selects the first.
- On a phone the list rows are now `role="option"` inside a listbox (VoiceOver iOS says
  "option" rather than "button"); behaviour and visuals are unchanged. Worth a listen during
  the smoke if that matters.
- Review closely: the render-phase `setLastLevelKey`/`setCursor0` in `tickets-board.tsx`, and the
  `pendingFocus` effect (runs every commit, applies once the right level is on screen).
- Unverified locally (typecheck and build are CI's): the TypeScript narrowings on `row0`/
  `previewing` and `cursor1`.

Context budget: read `launch-menu.tsx`, `lib/clipboard.ts`, `swipe-row.tsx` (head), `chip.tsx`
and `packages/ui` `grouped-list.tsx`/`sheet.tsx` beyond the `touches:` paths — to reuse the
copy/toast path, the chip's pressed state and the sheet's focus hooks rather than fork them.
