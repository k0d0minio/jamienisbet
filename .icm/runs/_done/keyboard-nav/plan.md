# Plan: keyboard-nav

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **The cursor model** — `components/board-model.ts` (pure): the ordered cursor rows for level 0
   (per visible section: the repo header, then its batches) and level 1 (the batch's tickets),
   each with a stable DOM id, what it previews (a `Selection`), what `c` copies (a
   pick-up + toast label, or null) and what `o` opens (a URL, or null). No React. — done when:
   the functions exist and `tickets-board.tsx` can derive rows, preview, copy target and GitHub
   URL for any cursor position without re-walking the board by hand.
2. **The key hook** — a new `components/use-board-keys.ts`: one `document` `keydown` listener,
   gated on `matchMedia("(min-width: <lg>)")` (read the breakpoint from the design tokens, not a
   literal), bailing on text-field targets, `isComposing`, Ctrl/Meta/Alt, and any open
   menu/sheet/dialog (detect via the open Radix layer — `[data-state="open"][role="menu"|"dialog"]`
   or the portal's focus trap — pick the one the existing split-button menu and `Sheet` expose).
   It owns the cursor (`useState`: level-0 index / level-1 index / `pane` focus flag) and maps
   each key to an intent the board executes. — done when: the hook is wired into `TicketsBoard`
   and every key in the spec's table dispatches.
3. **Board wiring** — `components/tickets-board.tsx`: the pane renders the level-0 **preview**
   when the cursor sits on a row at level 0 (a preview `Selection` overrides the URL one for the
   pane only); level-1 steps call `correct({ t })`; drill/back/commit/clear call `navigate`/`back`;
   `setFilter` clears `t`, `b` and `r` when it hides the selection; `[`/`]` walk `[null,
   ...chipRepos]` with wrap; the cursor is re-seated from the URL when the level changes, a click
   selects, or the filter changes; `scrollIntoView({ block: "nearest" })` on each step and on the
   active chip. — done when: every navigation criterion in the spec holds by hand on a preview.
4. **Copy, GitHub, refresh** — `c` reuses the exact clipboard + `toast` path `CopySplitButton`
   (`components/launch-menu.tsx`) uses (extract a shared `copyWithToast` if it is inline, don't
   duplicate the strings); `o` → `window.open(url, "_blank", "noopener,noreferrer")`; `r` must
   trigger the same transition as `BoardRefresh`, which lives in the title bar outside the board —
   lift its refresh into a tiny shared client module (or a context the page provides to both) so
   the key and the button share one pending state. — done when: `c`/`o`/`r` criteria hold.
5. **Semantics** — `role="listbox"` + `aria-activedescendant` + `aria-label` on each level's list
   container (`tabIndex={0}`, visible focus ring), `role="group"` + `aria-labelledby` per repo
   at level 0, `role="option"` + `aria-selected` + id on the repo header, `BatchRow`
   (`components/batch-row.tsx`) and `BoardTicketRow` (`components/board-ticket-row.tsx`). The rows
   hold buttons/links today — keep them as the click targets inside the option (don't nest an
   interactive role inside another's accessible name wrongly; check axe in the preview). The
   pane's scroller in `components/board-pane.tsx` gets `role="region"`, an `aria-label`,
   `tabIndex={-1}` and a ref the hook can focus. — done when: VoiceOver announces each step.
6. **The `?` sheet and hint** — a small `components/board-keys-sheet.tsx` on the design system's
   `Sheet`/`Dialog` (`packages/ui`), under `design-dna`: Move · Open · Act groups, mono keycaps;
   a `?` keycap hint at the list column's foot, `lg` only. Update the admin README's Tickets
   section with one paragraph on the keyboard map. — done when: the sheet criterion holds and the
   README names the keys.

## Risks

- **The preview vs URL split confuses the pane.** The pane must key its scroll reset on what it
  shows (preview or selection), or a preview → commit on the same batch jumps the scroll. Signal:
  the pane flickers or resets on `Enter` after previewing the same batch.
- **`correct` on arrows breaks `back()`'s "pushed from" check.** `correct` keeps the entry's
  `jnBoardPrev`, so back-out from level 1 after arrow steps should still find `?b=` as the parent
  and take a real history step. Signal: back-out pushes a new entry instead of stepping back.
- **Menu-open detection misses a portal.** If the split-button menu isn't detected, `j`/`k` move
  the list under an open menu. Signal: arrow keys inside the open menu move the board.
- **Nested interactive content in `role="option"`.** Options containing buttons/links trip axe;
  if it can't be made clean, the option wraps a non-interactive row and the click handler moves
  to the option. Signal: axe `nested-interactive` in the preview.
