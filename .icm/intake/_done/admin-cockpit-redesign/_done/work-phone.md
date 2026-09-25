# Stub: Work on the iPhone

- feature-slug: work-phone
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: work-reader
- sequence: 6 of 11
- complexity: medium
- recommended-model: sonnet

## Problem

On the phone the board is a drill of sheets and lists, and the launch is buried. Reading and launching tickets is one of the three things Jamie does on the phone.

## Proposed change

The compressed Work from the mockup. A plain title and a two-way switch: **Up next** (sections Up next, Running, Blocked, two-line rows) and **Repos** (each repo with its epics, a progress bar and the next stub). Tapping an epic pushes its stubs; tapping a stub pushes the reader: path, title, status line, stub and prompt together, then the epic's breakdown excerpt and build order. A sticky bar above the tab bar holds Launch (full width, 44px) and a copy button, with the model recommendation under it. Back is a swipe from the edge and a back button.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] Below the desk breakpoint Work shows the Up next / Repos switch, not the panes.
- [ ] Repo → epic → reader pushes and pops with the back button and an edge swipe, and each level has a URL.
- [ ] The reader's Launch bar stays visible while the body scrolls and clears the tab bar and the home indicator.
- [ ] Every target is at least 44px; nothing depends on hover.

## Out of scope (this feature)

- Desk layout changes.

## Notes for Define

D-2, D-21, D-10. Same data and selection model as the desk; one codepath for data, two layouts.

touches: websites/admin-dashboard/components/tickets-board.tsx, board-pane.tsx, ticket-detail.tsx, app/globals.css

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/work-phone.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that work-reader is merged to `main` first.
Then run `/pipeline new work-phone` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
