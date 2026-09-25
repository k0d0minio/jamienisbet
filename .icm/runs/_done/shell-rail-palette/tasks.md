# Tasks: shell-rail-palette

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [ ] At a viewport of 768px wide or more the rail is 56px wide, fixed to the leading edge, and the content area spans the rest of the window; below 768px there is no rail and the tab bar shows instead.
- [ ] The rail and the tab bar each show Work, Inbox and Leads in that order; the active item carries `aria-current="page"`; neither shows Money.
- [ ] The Inbox badge shows the uncapped count of stale open leads plus outreach due today plus woken nurture rows (a lead in both of the first two counted once), is hidden at 0, and is part of the item's accessible name.
- [ ] The rail's foot holds a palette button and sign out; sign out ends the session and lands on `/login`.
- [ ] ⌘K (macOS) or Ctrl+K opens the palette on `/`, `/inbox`, `/leads`, a lead's profile and `/money`, including when focus is in a text field; on a phone the title bar's search button opens it.
- [ ] Typing in the palette filters its Repos, Tickets, Leads and Actions groups; ↑/↓ move the highlight; Enter on a repo, ticket or lead navigates to `/?r=…`, `/?t=…` or `/leads/<id>` and closes the palette; Esc closes it and returns focus to where it was.
- [ ] "Launch next for <repo>" opens the same launch link the batch's Copy next menu offers for that epic, and "Estate check" opens the board's estate-check link, each in a new tab; no palette row names Money.
- [ ] The palette's data comes from a server action that calls `readBoard()` and `listClients({ archived: false })` — no new GitHub fetch function and no uncached GitHub read — and a missing `GITHUB_TOKEN` or a failed Neon read leaves the other groups working with a one-line note.
- [ ] `/` renders the Tickets board with the same behaviour as `/tickets` today, titled "Work"; `/?filter=…` and `/?archived=1` still redirect to `/leads`.
- [ ] `/inbox` renders the current Needs you feed with its sections, actions, skeleton and all-clear state, and its ticket rows link to `/?t=…`.
- [ ] `/tickets` and `/tickets?t=<repo>/<id>` (with or without other params) redirect to `/` and `/?t=<repo>/<id>` with the query unchanged.
- [ ] The board's refresh button re-reads the board on `/`.
- [ ] Leads, a lead's profile, the Inbox and Money keep today's content width; only Work widens.
- [ ] The rail, tab bar and palette render correctly in light and dark (system appearance), the tab bar clears the home-indicator safe area, every tab-bar and title-bar control is at least 44px on a touch device, and toasts and the add-lead button clear the new tab bar.
- [ ] `websites/admin-dashboard/README.md` describes Work at `/`, the Inbox at `/inbox`, the rail, the tab bar and the palette, and Money as reachable by URL only.
- [ ] CI's lint, typecheck and build pass on the PR head, and the admin's Vercel preview builds.

## Queue

- [x] Routes: feed → `/inbox`, board → `/` as Work, `/tickets` redirect (next.config.ts), revalidation off `/`
- [x] Desk tier linked; the shell's width cap moved into AppScreen (`wide` for Work)
- [x] Rail + flat tab bar (components/nav.tsx), tab geometry in globals.css
- [x] Inbox badge: lib/inbox.ts `countFollowUps`, streamed from the layout
- [x] Palette: components/command-palette.tsx + app/(app)/palette-actions.ts, title-bar trigger
- [x] README: screens, the shell section, navigation, layout tree
