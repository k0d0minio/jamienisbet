# Stub: Icon rail, command palette, and Work at home

- feature-slug: shell-rail-palette
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: desk-tier
- sequence: 3 of 11
- complexity: high
- recommended-model: opus

## Problem

The 240px sidebar takes too much room at the desk, and there is no fast way to jump to a repo, ticket or lead. Home is a feed Jamie rarely opens, while the tickets are where the day goes.

## Proposed change

Switch the admin shell to the desk tier. At the desk, a 56px icon rail — Work, Inbox, Leads — with count badges (Inbox: items waiting), the palette at its foot and sign out. On the phone, a flat bottom tab bar with the same three. The command palette (⌘K, and a button on the rail and the phone title bar) searches repos, tickets, leads and actions ("Launch next for <repo>", "Estate check"). Routes: Work (today's Tickets board, unchanged inside) moves to `/`; the current feed moves to `/inbox`; `/tickets` and old `?t=` links redirect to `/` keeping their query. Money leaves the navigation; its route stays reachable by URL and from the palette's actions only if Define judges that harmless.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] At ≥ the desk breakpoint the rail is 56px wide and the content takes the rest of the window.
- [ ] The rail and tab bar show Work, Inbox and Leads, in that order, with the Inbox count as a badge; Money appears in neither.
- [ ] ⌘K opens the palette from any screen; typing filters repos, tickets, leads and actions; enter goes there; escape closes it. On the phone the palette opens from a button.
- [ ] `/` opens Work; `/inbox` opens the feed; `/tickets?t=…` redirects to `/?t=…`.
- [ ] The shell renders in light and dark, respects safe areas, and works one-handed on a phone.

## Out of scope (this feature)

- Redesigning the screens inside the shell — later stubs.
- Removing the Money route or its Stripe code (D-17).

## Notes for Define

D-5, D-6, D-17. Open point from scope.md: where the desk layout starts (an iPad in portrait could take either). The palette's ticket and lead data should reuse the reads the screens already make; do not add a second fetch path if the board data can be shared.

touches: websites/admin-dashboard/app/(app)/layout.tsx, app/layout.tsx, app/globals.css, components/nav.tsx, components/app-screen.tsx, components/app-menu.tsx, components/command-palette.tsx (new), app/(app)/page.tsx, app/(app)/inbox/** (moved), app/(app)/tickets/** (redirect), proxy.ts, websites/admin-dashboard/README.md

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/shell-rail-palette.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that desk-tier is merged to `main` first.
Then run `/pipeline new shell-rail-palette` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
