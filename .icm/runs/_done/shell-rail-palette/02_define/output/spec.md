# Spec: Icon rail, command palette, and Work at home

- slug: shell-rail-palette
- personas: operator
- touches: websites/admin-dashboard/app/(app)/layout.tsx, websites/admin-dashboard/app/layout.tsx, websites/admin-dashboard/app/globals.css, websites/admin-dashboard/components/nav.tsx, websites/admin-dashboard/components/app-screen.tsx, websites/admin-dashboard/components/app-menu.tsx, websites/admin-dashboard/components/command-palette.tsx, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/(app)/loading.tsx, websites/admin-dashboard/app/(app)/inbox, websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/lib, websites/admin-dashboard/README.md
- complexity: complex

## Problem

The admin's shell was built phone-first and scaled up: at the desk a 240px sidebar takes width
the work needs, nothing jumps straight to a repo, a ticket or a lead, and home is the Needs you
feed, which Jamie rarely opens, while the tickets are where the day goes. The
`admin-cockpit-redesign` scope (initiative: operator cockpit; objective: less time finding work,
more time launching it) makes Work home (D-6), replaces the sidebar with a 56px icon rail and a
⌘K command palette (D-5), and takes Money out of the navigation (D-17). This stub (3 of 11) is
the shell every later screen stub merges over; the desk tier it runs on landed in `desk-tier`.

## Proposed change

The design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC — the design-system sheet
and "Work, three panes" for the rail and palette, "Work on iPhone" for the phone chrome; sample
data) is the visual reference.

**1. The admin links the desk tier.** `app/globals.css` imports `@jamie-nisbet/ui/desk.css` after
`styles.css` (and alongside `app.css`, which the unmigrated screens still need until
`retire-app-tier`). The new shell chrome — rail, tab bar, palette — is built from the desk
primitives (`RailItem`, `CommandPalette` and its parts, `Kbd`, `StatusDot`, `DeskButton`) inside
a `desk-tier` root, so it renders in Hanken Grotesk and the desk tokens while the screens inside
keep their app-tier look until their own stubs move them.

**2. Where the desk starts: `md` (768px).** From `md` up the shell is the rail; below it, the tab
bar. An iPad in portrait therefore gets the rail (it costs 56px); how many panes Work shows at a
given width is `work-panes`' call, not this stub's. Touch sizing is the desk tier's own
`pointer: coarse` step — rail items go to 44px on a touch iPad from the same markup.

**3. The rail (from `md`).** A 56px column fixed to the leading edge, full height, a hairline on
its trailing side, flat (no material, no shadow). Top: the JN mark. Then Work, Inbox, Leads, in
that order, each a `RailItem` with a lucide icon, a `title` tooltip and `aria-current="page"` when
active (Work is active on `/` only; Inbox on `/inbox`; Leads on `/leads` and every `/leads/*`).
Inbox carries the count badge (below). At its foot: the palette button ("Go anywhere (⌘K)") and
sign out (the existing logout action). The content area takes the rest of the window: the shell's
`max-w-5xl` cap goes, Work fills the width, and every other screen keeps its current reading width
by carrying the cap itself — so Leads, the lead profile, the Inbox and Money look exactly as they
do today apart from the chrome.

**4. The tab bar (below `md`).** A flat bar welded to the bottom edge on a top hairline — no
floating pill, no blur — with Work, Inbox, Leads (icon + label, same order and badge as the rail),
each at least 44px tall, clearing the home-indicator safe area. The `--admin-tab-*` geometry in
`globals.css` is updated to the new bar, so `pb-tabs`, the floating add button and the Toaster
offset still clear it. The phone title bar (`AppScreen`, `AppProfileScreen`) gains a search
button beside the JN menu that opens the palette; the JN menu keeps sign out on the phone.

**5. The command palette.** `components/command-palette.tsx`, mounted once in the shell, built on
the desk `CommandPalette` primitive (Radix dialog: focus trap, Esc closes, focus returns).

- **Opens with** ⌘K on macOS and Ctrl+K elsewhere, from any screen in the authenticated area
  (including while focus is in a field), with the rail's palette button, and with the phone
  title bar's search button. Pressing the shortcut while it is open closes it.
- **Results, in four groups in this order:** Repos, Tickets, Leads, Actions.
  - *Repos* — every repo on the board; meta: open count. Enter → `/?r=<repo>`.
  - *Tickets* — every open ticket on the board (epic stubs, triage, backlog, runs in flight); a
    `StatusDot` for its state; meta: `repo / batch`. Enter → `/?t=<repo>/<id>`.
  - *Leads* — every non-archived lead and customer (prospects included); matched on name and
    company; meta: status. Enter → `/leads/<id>`.
  - *Actions* — "Launch next for <repo>" once per epic that has a next stub (meta: the epic),
    which opens that stub's default launch link (the same link the batch's Copy next menu builds
    today) in a new tab; "Estate check", which opens the board's existing estate-check launch
    link in a new tab; and "Go to Work", "Go to Inbox", "Go to Leads". Money is **not** an action
    or a result (D-17): `/money` stays reachable by URL only.
- **With an empty query** the palette shows the Actions group only. **Typing** filters every
  group case-insensitively on its label and meta — matches starting at a word boundary rank
  before mid-word ones — each group capped at 8 rows, a group with no match hidden, and one empty
  line ("Nothing matches") when no group has a row. ↑/↓ move the highlight across groups
  (wrapping), Enter runs the highlighted row and closes the palette, Esc closes it.
- **Data — one read path, no new one.** The palette's index is fetched when the palette opens,
  by a server action that calls the same `readBoard()` the Work screen renders from (its GitHub
  reads are served from the board's existing 60-second cache and tags — no new GitHub request
  shape, no bypass of the 8-request cap) and the same `listClients({ archived: false })` the
  Leads screen reads, and returns a slim, serialisable index (label, meta, href or launch URL,
  status) — no ticket bodies. While it loads, the Actions that need no data (the three Go to
  rows) show at once with a loading line under them. A source that is not configured or fails
  drops its groups and leaves one line saying what could not be read ("GitHub isn't configured
  here" / "Leads couldn't be read"); the palette never errors as a whole.

**6. The Inbox badge counts follow-ups.** The number on Inbox (rail and tab bar) is the uncapped
total of the three follow-up kinds (D-15): open leads waiting past the staleness threshold, the
outreach due by today, and the nurture wakes whose date has come — counted once per lead where a
lead is both stale and due, the way the feed already de-duplicates them. Neon only: invoices
and today's tickets are not counted (they leave the Inbox in `inbox-rebuild`, which then makes
the badge equal its rows). The count is read in the shell and streamed, so no screen waits on it;
it is hidden at 0 and when the read fails, and its value is part of the item's accessible name
("Inbox, 9 waiting").

**7. Routes.**

- `/` is **Work**: today's Tickets board, unchanged inside (same component, same `?t=` `?b=`
  `?r=` `?repo=` URL state, same keyboard map, same refresh). Its page title is "Work".
  The old leads bookmarks the feed page redirected (`/?filter=…`, `/?archived=1`) keep
  redirecting to the same view on `/leads`.
- `/inbox` is the **current Needs you feed**, moved as is (its sections, rows, actions, loading
  skeleton and all-clear state); its own links to a ticket become `/?t=…` and "all tickets"
  becomes `/`.
- `/tickets`, with any query, redirects permanently to `/` keeping the query string intact
  (`/tickets?t=a/b&repo=x` → `/?t=a/b&repo=x`).
- The board's refresh (the `updateTag` action and any path revalidation) and every in-app link
  that pointed at `/tickets` or at `/` as the feed now point at `/` as Work and `/inbox` as the
  feed.
- `/money` is unchanged and reachable by URL; the feed's invoice rows keep linking to it until
  `inbox-rebuild` removes them.

**8. Docs.** `websites/admin-dashboard/README.md`: the screens table (Work at `/`, Inbox at
`/inbox`, Leads, Lead, Money reachable by URL only), the navigation paragraph in Mobile & PWA
(rail from `md`, flat tab bar below, the palette and its shortcut), and the Layout tree
(`inbox/`, `command-palette.tsx`, the moved loading skeletons).

## Acceptance criteria

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

## Out of scope

- Redesigning any screen inside the shell: Work's panes (`work-panes`), the reader and one-click launch (`work-reader`), Work on the phone (`work-phone`), the Inbox (`inbox-rebuild`, `gates-read`), Leads and the profile (`leads-table-board`, `lead-profile-columns`).
- Removing the Money route, its page or its Stripe code, and removing the feed's Money section or Today's tickets from the Inbox (D-17; `inbox-rebuild`).
- Moving login, not-found, error and loading screens, pull-to-refresh or toasts to the desk tier, and deleting the app tier (`retire-app-tier`).
- A palette ranked by recency or frecency, fuzzy (non-contiguous) matching, archived leads in the palette, or palette actions that change data.
- Carrying model and effort into the launch link (`work-reader`).
- The sticky action bar on phone screens (`work-phone`).

## Open questions

- none
