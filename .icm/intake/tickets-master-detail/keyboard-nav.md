# Stub: Keyboard navigation on desktop

- feature-slug: keyboard-nav
- sequence: 6 of 6
- depends-on: ticket-view, epic-view, repo-and-estate-views
- priority: P2
- size: S

## What this is

Drive the board without the mouse, from `lg` up. Keys are inert while focus is in a text
field or a menu is open.

- `↑`/`↓` and `k`/`j` — move the selection through the current list level; the pane
  follows immediately and the row scrolls into view.
- `Enter` / `→` / `l` — on an epic row, drill into level 1; on a stub, focus the pane.
- `Esc` / `←` / `h` — back up a level (stub → epic list → repos); from level 0, clear the
  selection (estate overview).
- `c` — copy the selected ticket's pick-up (or the epic's Copy next), same toast as the
  button.
- `o` — open the selection on GitHub in a new tab.
- `r` — refresh the board (same as the button).
- `[` / `]` — previous / next repo in the chip rail.
- `?` — a small sheet listing these.

Roving focus with real `aria-selected`/`aria-activedescendant` semantics, so a screen
reader follows the same selection.

## Prompt

Read `.icm/intake/tickets-master-detail/breakdown.md`, then this stub
(`.icm/intake/tickets-master-detail/keyboard-nav.md`). `ticket-view`, `epic-view` and
`repo-and-estate-views` must be merged. Then read the board's client root and list
components in `websites/admin-dashboard/` and the `design-dna` skill.

Add the desktop keyboard map the stub lists — selection movement, drill in/out, copy,
GitHub, refresh, repo switching, a `?` help sheet — with proper listbox semantics, and
keys disabled in text fields and open menus.

Work on a `claude/` branch, open a PR, let CI verify (never build locally), check the
Vercel preview on desktop with keyboard only. In the same PR, `git mv` this stub to
`.icm/intake/tickets-master-detail/_done/`.
