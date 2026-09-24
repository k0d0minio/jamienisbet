# Tasks: keyboard-nav

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] At `lg`+, with focus on the page body and nothing selected, `↓` (and `j`) puts a cursor on
- [ ] At level 0, `Enter`, `→` and `l` on a batch row each drill to level 1 with `?b=` pushed and
- [ ] At level 1, `↓`/`↑`/`j`/`k` move through the stubs; each step replaces (does not push) the
- [ ] At level 1, `Enter`/`→`/`l` moves focus into the pane; there `↓`/`↑`/`j`/`k` scroll the
- [ ] `Esc`/`←`/`h` at level 1 returns to level 0 with the cursor on the batch just left; at
- [ ] `c` copies the selected ticket's pick-up (level 1 or pane), or a batch's Copy next (level 0
- [ ] `o` opens the ticket's file, the batch's folder or the repo on GitHub in a new tab — the
- [ ] `r` runs the same refresh as the title-bar button (its pending state and "as of" stamp
- [ ] `]` steps the chip filter All → first chip → … → last chip → All, and `[` the reverse,
- [ ] `?` opens a sheet listing every key in this spec; `Esc` closes it and returns focus to where
- [ ] No board key fires while focus is in a text field, while the copy split button's menu (or
- [ ] Below `lg` none of these keys do anything, and the phone board behaves exactly as before
- [ ] Each list level is a `role="listbox"` with `aria-activedescendant` naming the cursor row,
- [ ] Clicking a row still selects it exactly as before and moves the keyboard cursor there;

## Queue

- [ ] <task — small enough for one commit; name the file or area>
