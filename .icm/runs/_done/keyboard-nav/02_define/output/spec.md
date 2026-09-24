# Spec: Keyboard navigation on the Tickets board (desktop)

- slug: keyboard-nav
- personas: operator
- touches: websites/admin-dashboard/components, websites/admin-dashboard/app/(app)/tickets
- complexity: standard

## Problem

The Tickets board (`/tickets` in the admin dashboard) is now a master–detail view — a list that
drills (repos → a batch's stubs) beside a pane that shows a ticket, an epic, a repo or the estate
overview — but on a desktop every one of those moves is a mouse click. The operator reads the
board at a desk several times a day to pick the next piece of work across the estate; walking
down a batch, reading each stub, copying one pick-up and moving to the next repo is a sequence of
aimed clicks the keyboard could do in a few keystrokes. This is stub 6 of the
`tickets-master-detail` epic (breakdown decision 8, "kept: keyboard navigation on desktop"), last
because every view it moves between now exists (#160, #161, #162). It serves the operator's
estate glance: see what's next and send it without leaving the keyboard.

## Proposed change

A desktop keyboard map for the board, active from `lg` up only. Below `lg` nothing changes —
touch, swipes and the pushed views behave exactly as today. One document-level key handler, so
the keys work from page load without first clicking the list.

**Where keys are inert.** No key in this map fires when: focus is in a text field (`input`,
`textarea`, `select`, anything `contenteditable`); a menu, popover, sheet or dialog is open
(including the copy split button's chevron menu and the `?` sheet itself — its own `Esc` closes
it); or any of Ctrl/Meta/Alt is held (browser and OS shortcuts are never taken). `Shift` is
ignored only where the key itself needs it (`?`).

**The three places the keyboard can be.**

1. **List level 0 — the repos.** A cursor walks, in on-screen order, each visible repo's header
   row and its batch rows (epics, Triage, Backlog, In flight). The chip rail is not in the
   cursor's path (it has its own keys, `[`/`]`). **The pane previews the row under the cursor**:
   a repo header shows that repo's view, a batch row that batch's view — without writing the URL
   and without drilling the list. The URL keeps the committed selection only, so a copied link
   and back/forward are unaffected by where the cursor rests. With no cursor yet (fresh load,
   nothing selected) the pane shows what the URL selects, as today.
2. **List level 1 — a batch's stubs.** The cursor walks the stubs (the "‹ repo" back row is not
   in its path). Here the cursor **is** the selection: each step writes `?t=` and the pane shows
   that ticket.
3. **The pane.** Focus moves into the pane's own scroll container, so it reads with the
   keyboard.

**The keys.**

| Key | Level 0 (repos) | Level 1 (stubs) | Pane focused |
| --- | --- | --- | --- |
| `↓` / `j` | cursor to next row, pane previews it | next stub, `?t=` follows | scroll the pane down (the native arrow step; `j` does the same) |
| `↑` / `k` | cursor to previous row | previous stub | scroll the pane up (`k` likewise) |
| `Enter` / `→` / `l` | batch row → commit `?b=` and drill to level 1, cursor on its first stub (its selected stub if one is); repo header → commit `?r=` and focus the pane | focus the pane (the ticket stays selected) | — |
| `Esc` / `←` / `h` | clear the selection (`?t/b/r` removed, pane shows the estate overview; the cursor stays on its row) | back to level 0, cursor on the batch row just left (drops `?t`/`?b`) | back to the list, cursor where it was |
| `c` | copy what the row under the cursor offers (below) | copy the selected ticket's pick-up | copy what the pane's selection offers |
| `o` | open the cursor's row on GitHub in a new tab | open the ticket on GitHub | open the selection on GitHub |
| `r` | refresh the board | same | same |
| `[` / `]` | previous / next stop in the chip rail | same | same |
| `?` | open the key sheet | same | same |

Esc from a pane opened on a ticket returns to level 1; from a pane opened on a repo (level 0
commit) it returns to level 0 with the cursor on that repo's header. `Esc` at level 0 with
nothing selected does nothing. Movement stops at the first and last row (no wrap). The cursor row
is scrolled into view (`block: "nearest"`) on every step.

**`c` — the same copy and the same toast as the button.** A ticket copies its pick-up exactly as
its `CopySplitButton`'s main segment does. An epic, Triage or Backlog batch copies its **Copy
next** (the next stub's pick-up), as the batch view's button does. A batch with nothing to copy
(no next stub with a pick-up — In flight, or an empty batch), a repo, or the overview shows a
toast "Nothing to copy here" and copies nothing. Recut and maintenance launchers are never bound
to a key.

**`o` — GitHub.** A ticket opens its file, a batch its folder (`batch.htmlUrl`), a repo its
repository — the same URLs the "Open on GitHub" rows already use. With nothing selected and no
cursor, `o` does nothing.

**`r` — refresh.** The same action as the title bar's `BoardRefresh` button (full bust,
`refreshBoard`, its pending state and "as of" stamp included), with the cursor, the selection and
the level all kept afterwards. Pressed while a refresh is already pending it does nothing.

**`[` / `]` — the repo filter.** Stops in rail order: **All**, then each chip. `]` past the last
chip wraps to All; `[` on All wraps to the last chip. Works from every level. The filter change
is written as `setFilter` writes it today, with one correction: a filter that hides the current
selection clears the **whole** selection (`t`, `b` and `r`, not only `t`), so the list lands on
level 0 of the new filter, cursor on its first row; a selection the new filter still shows is
kept. The chip that became active is scrolled into view in the rail.

**`?` — the key sheet.** A small sheet (the design system's existing sheet/dialog, per
`design-dna`) listing every key above, grouped as Move · Open · Act, each key set in mono in a
keycap style. `Esc` or a click outside closes it and returns focus where it was. The board shows
one quiet affordance that the sheet exists — a `?` keycap hint in the list column's foot, `lg`
only.

**History.** Only commits write history. `↑`/`↓` at level 1 **replace** the current entry
(`correct`, not `navigate`), so the browser's back steps through levels and selections, not
through every row passed. Drilling in, backing out, committing a repo, clearing the selection and
changing the filter each **push**, as a tap does today; back-out uses the existing `back()`, so a
real history step is taken where one exists. The level-0 preview writes nothing.

**Semantics — the screen reader follows the same cursor.** Each list level is one
`role="listbox"` (labelled "Repos and batches" at level 0, "<batch title> stubs" at level 1)
holding `role="option"` rows, with `aria-selected="true"` on the cursor row and
`aria-activedescendant` on the listbox pointing at it; at level 0 each repo is a `role="group"`
labelled by its slug, its header an option like the batch rows. Every key that moves the cursor
first moves DOM focus to the listbox, so assistive tech announces the change; the focused
listbox shows a visible focus ring, and the cursor row carries the board's existing active-row
highlight (`ACTIVE_ROW`). The pane's scroll container is a labelled `role="region"` with
`tabIndex={-1}` so it can take focus. Mouse and touch keep working unchanged: a click on a row
selects it as today and moves the cursor there. `Tab` still reaches every control inside the rows
and the pane in document order — the listbox roving cursor does not trap `Tab`.

Invariants that must survive untouched: every URL key (`?repo=`, `?t=`, `?b=`, `?r=`) and its
fallbacks, deep links, back/forward, the phone layout and its swipes and pushed views, the refresh
and on-return re-read, the read-only contract (no key writes anything but the URL and the
clipboard), and the GitHub cache invariants in `lib/tickets.ts` (untouched — no data change).

## Acceptance criteria

- [ ] At `lg`+, with focus on the page body and nothing selected, `↓` (and `j`) puts a cursor on
      the first visible repo header and the pane shows that repo's view; further `↓`/`↑`
      (`j`/`k`) walk repo headers and batch rows in on-screen order, the pane previewing each,
      the URL unchanged, stopping at the first and last row.
- [ ] At level 0, `Enter`, `→` and `l` on a batch row each drill to level 1 with `?b=` pushed and
      the cursor on the batch's first stub; on a repo header they push `?r=` and move focus into
      the pane.
- [ ] At level 1, `↓`/`↑`/`j`/`k` move through the stubs; each step replaces (does not push) the
      history entry with that stub's `?t=`, and the pane shows the ticket immediately; the
      cursor row is scrolled into view.
- [ ] At level 1, `Enter`/`→`/`l` moves focus into the pane; there `↓`/`↑`/`j`/`k` scroll the
      pane, and `Esc`/`←`/`h` return focus to the list with the same stub under the cursor.
- [ ] `Esc`/`←`/`h` at level 1 returns to level 0 with the cursor on the batch just left; at
      level 0 with a selection it clears the selection and the pane shows the estate overview;
      the browser's back button after a drill-in and three arrow steps returns to level 0 in one
      step.
- [ ] `c` copies the selected ticket's pick-up (level 1 or pane), or a batch's Copy next (level 0
      cursor on a batch row), showing the same toast the corresponding button shows; on a repo,
      the overview, or a batch with no next pick-up it shows "Nothing to copy here" and the
      clipboard is unchanged.
- [ ] `o` opens the ticket's file, the batch's folder or the repo on GitHub in a new tab — the
      same URL as that view's "Open on GitHub".
- [ ] `r` runs the same refresh as the title-bar button (its pending state and "as of" stamp
      update) and the cursor, selection and list level are the same afterwards.
- [ ] `]` steps the chip filter All → first chip → … → last chip → All, and `[` the reverse,
      from any level; a filter that hides the current selection clears `t`, `b` and `r` and lands
      on level 0; one that still shows it keeps it.
- [ ] `?` opens a sheet listing every key in this spec; `Esc` closes it and returns focus to where
      it was; while it is open no board key fires.
- [ ] No board key fires while focus is in a text field, while the copy split button's menu (or
      any other menu, sheet or dialog) is open, or while Ctrl, Meta or Alt is held.
- [ ] Below `lg` none of these keys do anything, and the phone board behaves exactly as before
      (drill, pushed views, swipes, back gesture).
- [ ] Each list level is a `role="listbox"` with `aria-activedescendant` naming the cursor row,
      which carries `aria-selected="true"` (and only it); at level 0 repos are `role="group"`s;
      a screen reader (VoiceOver on macOS) announces the row on each arrow step.
- [ ] Clicking a row still selects it exactly as before and moves the keyboard cursor there;
      `Tab` still reaches every button and link in the list and pane.

## Out of scope

- Any keyboard map below `lg` (phones and tablets with keyboards included).
- User-configurable or remappable keys; chorded shortcuts (`g t` style); a command palette or
  search.
- Keys for Recut, maintenance launchers, the split button's other tools, or the swipe actions.
- Keyboard navigation elsewhere in the dashboard (Needs you, Leads, Money) or a global shortcut
  layer.
- Making the chip rail itself a keyboard-navigable toolbar beyond `[`/`]` (it stays reachable by
  `Tab`, as today).
- Any change to what the board reads or caches (`lib/tickets.ts`).

## Open questions

- none — the level-0 behaviour (preview in the pane, commit on `Enter`), history (arrows replace,
  commits push) and the `[`/`]` stops (All included, wrapping) were settled with the operator in
  Define on 2026-09-24.
