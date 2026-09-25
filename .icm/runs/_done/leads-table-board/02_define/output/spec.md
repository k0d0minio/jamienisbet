# Spec: Leads as a table and a deal-stage board

- slug: leads-table-board
- personas: operator
- touches: websites/admin-dashboard/app/(app)/leads/page.tsx, websites/admin-dashboard/app/(app)/leads/loading.tsx, websites/admin-dashboard/components/leads-table.tsx, websites/admin-dashboard/components/deal-board.tsx, websites/admin-dashboard/components/lead-row.tsx, websites/admin-dashboard/components/client-status-select.tsx, websites/admin-dashboard/components/deal-stage-chip.tsx, websites/admin-dashboard/components/deal-badges.tsx, websites/admin-dashboard/components/client-create-form.tsx, websites/admin-dashboard/lib/leads.ts, websites/admin-dashboard/lib/deals.ts, websites/admin-dashboard/README.md
- complexity: standard

## Problem

At the desk the Leads screen is the phone's inset rows stretched wide: nothing lines up in
columns, nothing sorts except the one order the query hands over, and there is no view of the
pipeline by deal stage, although every deal folder in icm-board already says which stage it is
at. The `admin-cockpit-redesign` scope (initiative: operator cockpit; objective: less time
finding work, more time launching it) makes the admin a desk tool first (D-1), flat and dense
(D-3), and gives Leads a sortable table and a read-only board by deal stage (D-19), with the two
"worth a look" counts kept as Leads filters when they leave the feed (D-18). This stub (9 of 11)
rebuilds `/leads` on the desk tier that `desk-tier` shipped, inside the shell that
`shell-rail-palette` shipped. The phone stays a real work surface (D-2, D-21): its rows keep
their gestures.

## Proposed change

The design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC — the "Leads" artboard;
sample data) is the visual reference. "The desk" means a viewport 768px wide or more (the
shell's `md`, where the rail starts); "the phone" is below it.

**1. The screen moves to the desk tier and widens.** `/leads` renders inside a `desk-tier` root
with the desk tokens, Hanken Grotesk for UI text and IBM Plex Mono for figures, dates, stage
codes and tiers (D-4). Nothing here reaches the marketing sites (D-22). At the desk it spans the whole content area beside the rail (it no longer
keeps the reading width). No inset grouped slabs, no glance row, no materials, no springs.

**2. The header (desk).** One 56px bar on a bottom hairline, left to right:

- the screen's title — "Leads", "Prospects", "Archived", "Archived prospects", or the crack's
  title, exactly as today;
- the cash totals as one mono line — `€5,700 in play · €570/month · €500 in kind` — computed as
  today (cash only; equity and commission never folded in), each figure shown only when it is
  above zero, and the line absent in the prospects view and in a crack view, as today;
- the **Table / Board** switch (the desk segmented control), in every view;
- **Prospects** (with the size of the cold pool in mono beside the word) and **Archived** as
  toggle buttons that switch population exactly as today's chips do (switching population resets
  the filter to All) — hidden in a crack view, as today;
- **Add lead** (primary), which opens today's create form — shown only where today's `+` is
  (the Leads view, not archived, not prospects, not a crack).

**3. The filter bar (desk and phone).** Under the header, one row:

- the population's filters with their counts, exactly as today — All / Open / Clients / Not won
  on the Leads view, All / Working / Nurture on the prospects view — as links that keep the view,
  the archive flag, the layout and the sort;
- on the Leads view only (not archived, not prospects), after a hairline divider, the two crack
  filters from the feed — **Nothing planned** and **Gone quiet** — each with its count, computed
  from the same non-archived rows with the same predicates the crack view lists (`hasNoPlan`,
  `isIdleDiscussion`), linking to `?crack=unplanned` / `?crack=idle`;
- in a crack view the population filters stand down, the crack's own filter reads active, and the
  crack's one-line blurb with "Back to Leads" shows, as today.

The crack view keeps every rule it has today: it lists exactly the rows the count covered, ignores
`archived` and `view`, and has its own empty state.

**4. The table (desk, layout Table — the default).** A `DataGrid` (real `<table>`, sticky
header, 40px rows, hairlines) inside a region that scrolls on both axes when the window is
narrower than the columns — never the page. Nine columns, in this order:

| Column | Cell | Sort (first click → second click reverses) |
| --- | --- | --- |
| **Name** | a monogram, the name (semibold), and under it the company — or, when there is none, what `whoLabel` / `prospectLabel` say today; the name muted for a past client, a not-won lead and a nurtured prospect | A→Z |
| **Status** | the status word from `clientStatusLabel`, read-only | the ladder's order (`clientStatuses`) |
| **Deal stage** | the deal folder's stage in mono, `03 quote`; `—` when there is none | 01→08, none last |
| **Value** | the row's headline figure as the list shows it today (`dealFigure(...).standalone`), right-aligned mono; `—` for a prospect or a row with no deal | highest first, by the headline's euro amount (cash, support or barter); rows whose headline is a percentage, and rows with no deal, last |
| **Next step** | the next action's text; "Nothing planned", muted, for a row `hasNoPlan` matches; `—` otherwise | A→Z, empty last |
| **Due** | the next action's date (`formatShortDay`), mono, red once past; for a nurtured prospect with no next action, its wake date; `—` when none | soonest first, none last |
| **Last worked** | `today` or `N days` since the last touch (intake counting as the first), mono; for an open lead past the staleness threshold, `waiting N days` in red | longest waiting first |
| **Tier** | the fit tier letter in mono (spoken "Tier A"), `—` when ungraded | A→C, ungraded last |
| _(actions)_ | three icon buttons, always visible: **WhatsApp** (opens the chat for `whatsapp ?? phone`), **Email** (`mailto:`), **Mark touched** (records a touch through today's `markTouched` action, with today's toast); WhatsApp or Email is shown disabled, with a title saying the number or address is missing, when the row has none. In the archived view the three are replaced by **Restore** and **Delete** (Delete asks for confirmation, as the swipe does today) | not sortable |

- **Clicking a row** (anywhere outside the action buttons) opens `/leads/<id>`.
- **Sorting** is kept in the URL — `?sort=<name|status|stage|value|next|due|last|tier>&dir=<asc|desc>`
  — and done on the server, so a reload or a shared link keeps it. The sorted column's header
  carries `aria-sort` and the arrow. Empty values sort last in either direction; ties keep the
  view's default order underneath. **With no `sort` param each view keeps today's order**: the
  Leads view, the archive and "Gone quiet" longest-waiting first (the Last worked header shows the
  descending arrow), the prospects view and "Nothing planned" on `compareProspects` (no header
  arrow). An unknown `sort` or `dir` value is ignored.
- **The status can no longer be changed from the list, and archive / delete are no longer on a
  live row** — all three are on the lead's profile, where they already are.
  `components/client-status-select.tsx` loses its last caller and is deleted.

**5. The keyboard (desk, table).** `j` / `k` move a highlight down / up the rows (the first `j`
highlights the first row; the highlight is the grid's selected row and is scrolled into view);
`Enter` opens the highlighted lead; `t` marks the highlighted lead touched (not in the archived
view). The keys are ignored while focus is in an input, textarea, select or editable field,
while a dialog, sheet or the command palette is open, and when a modifier key is held — so ⌘K /
Ctrl+K stay the palette's.

**6. The board (desk, layout Board).** Chosen with the switch; kept in the URL as
`?layout=board` (Table is the default and has no param), alongside the view, archive flag,
filter or crack and sort. It is offered **in every view** — Leads, prospects, archived and the
two crack views — and shows exactly the rows the table would show under the same view and
filter.

- **Columns:** "No folder" first, then one column per stage `01 intake` … `08 handover`, each
  headed by its code in mono, its name and its card count; all nine always show, an empty one
  with 0. The columns scroll sideways inside the screen when they do not fit.
- **Which column:** the stage `dealStages()` in `lib/deals.ts` reads from the lead's deal folder
  (the folder named after the row's delivery repo, D28 in icm-board). A lead with no repo, no
  folder, no live engagement or no `NN-` artefact yet sits in **No folder**.
- **A card** shows the name (muted by the table's rule), the headline figure in mono (none for a
  prospect), the next step when there is one, and a mono foot line: `due <date>` (red when past),
  else `waiting N days` (red) for a stale open lead, else the status word. The whole card is a
  link to `/leads/<id>`. Inside a column, cards follow the active sort (or the view's default
  order).
- **Read-only (D-19):** cards cannot be dragged, and nothing on the board writes.
- **When the stages cannot be read** (no `GITHUB_TOKEN`, or icm-board's tree read fails), every
  card sits in No folder and one line above the columns says the deal stages could not be read.
  `dealStages()` gains a way to tell "read, and no folder" from "could not read" — the same
  signal the table's stage column uses to show `—` rather than guess. Its caching stays exactly
  as `lib/deals.ts` sets it (`force-cache`, the 60-second tree, the tag); the page never exports
  `dynamic = "force-dynamic"`.

**7. The phone.** The list stays rows, and Table / Board is not offered (a `layout=board` URL
opened on a phone shows the rows). The rows are restyled to the desk tier: flat, full-bleed,
hairline-separated, at least 44px tall, in the desk type scale — the name and the figure (or the
tier for a prospect) on the first line, the next step / wake / waiting line and the status word
on the second, the deal-stage chip and deal badges on a third where a row has them, exactly the
content they carry today. They keep today's gestures unchanged — swipe right marks touched,
swipe left opens WhatsApp / Email / Archive (Restore / Delete in the archive view) — and every
tray action keeps its non-gesture twin on the lead's profile. The rows follow the URL's sort. The
totals line, the filter bar (scrolling sideways when it does not fit) and the crack filters show
above the rows; the title bar keeps the shell's palette button and JN menu, the Prospects and
Archived switches, and the floating add button where it shows today.

**8. States.** The empty states keep today's four messages (nothing under this filter, nothing
archived, no prospects yet, no leads yet) and the closed-crack message, set in the desk tier; a
failed database read keeps its one-line banner with the rest of the screen standing.
`app/(app)/leads/loading.tsx` becomes a desk-tier skeleton of the new screen (header, filter bar
and table rows at the desk; rows on the phone), so the page does not jump when it lands.

**9. Docs.** `websites/admin-dashboard/README.md` § Leads describes the table, its columns and
URL-kept sort, the board, the crack filters, the keyboard, and the phone rows — replacing the
"one codepath from phone to laptop / the wide table is gone" paragraphs; the Layout tree names
`leads-table.tsx` and `deal-board.tsx` and drops `client-status-select.tsx`.

## Acceptance criteria

- [ ] At 768px wide or more, `/leads` shows a table with the columns Name, Status, Deal stage, Value, Next step, Due, Last worked, Tier and a row-actions column, spanning the content area beside the rail.
- [ ] Clicking any of the eight data column headers sorts the rows by it, a second click reverses it, and the URL carries `sort` and `dir`; reloading the page keeps the order; with no `sort` param the Leads view is longest-waiting first, as today.
- [ ] The sorted column's header carries `aria-sort` and the arrow; empty values sort last in both directions.
- [ ] Clicking a row outside its action buttons opens that lead's profile; WhatsApp opens the chat, Email opens a `mailto:` link, and Mark touched records a touch and shows the toast, without opening the profile.
- [ ] In the archived view the row actions are Restore and Delete (Delete asks to confirm); no live row carries a status menu, archive or delete, and `client-status-select.tsx` no longer exists.
- [ ] `j` / `k` move a visible highlight through the table rows, `Enter` opens the highlighted lead, and `t` marks it touched; none of the three fire while typing in a field, while the palette or a sheet is open, or with ⌘ / Ctrl held.
- [ ] The Table / Board switch changes the layout on every view (Leads, prospects, archived, both cracks), and the choice is kept in the URL as `layout=board` together with the view, filter or crack and sort.
- [ ] The board shows "No folder" and one column per stage 01–08 with a count each; every lead lands in the column its deal folder's stage names, and a lead with no readable stage lands in "No folder"; the board shows the same rows the table shows for that view and filter.
- [ ] Board cards show name, figure, next step (when set) and the due / waiting / status foot, link to the profile, and cannot be dragged; nothing on the board changes data.
- [ ] With `GITHUB_TOKEN` unset, the table's Deal stage column reads `—`, the board puts every card in "No folder" and says in one line that the deal stages could not be read, and the rest of the screen works.
- [ ] The header shows In play / per month / In kind as cash-only totals computed as today, only the non-zero ones, and none in the prospects or crack views.
- [ ] The filter bar shows All / Open / Clients / Not won (or All / Working / Nurture on prospects) with counts that add up to All; on the Leads view it also shows Nothing planned and Gone quiet with counts equal to the rows each crack view then lists.
- [ ] The Prospects and Archived switches, the crack views (`?crack=unplanned`, `?crack=idle`) with their blurb and Back to Leads link, and Add lead work as they do today.
- [ ] Below 768px the list is rows (no table, no board switch) on the desk tier, each at least 44px tall; swipe right marks touched and swipe left reveals WhatsApp / Email / Archive (Restore / Delete when archived), exactly as today.
- [ ] The empty states, the closed-crack state and the database-error banner render on the desk tier, and the loading skeleton matches the new layout at both widths.
- [ ] The screen reads correctly in light and dark (system appearance), and no route under `app/(app)/leads` exports `dynamic = "force-dynamic"`.
- [ ] `websites/admin-dashboard/README.md` § Leads describes the table, sort, board, crack filters, keyboard and phone rows, and no longer says the wide table is gone.
- [ ] CI's lint, typecheck and build pass on the PR head, and the admin's Vercel preview builds.

## Out of scope

- Changing a lead's deal stage from the board, dragging cards, or any write from the board (D-19).
- Changing a lead's status from the list (it stays on the profile).
- The lead profile and its j/k between leads — `lead-profile-columns`.
- Keyboard navigation on the board, a `?` shortcut sheet for Leads, and column resizing, hiding or reordering.
- Sorting on the phone from a control (the rows follow a sort set at the desk or in the URL, but the phone gets no sort UI).
- Multi-select and bulk actions on rows.
- Retiring the app tier elsewhere — the phone title bar (`AppScreen`), pull-to-refresh and toasts move in `retire-app-tier`.
- Removing the crack counts from the Inbox — `inbox-rebuild`.
- The scope's decisions that belong to sibling stubs and do not apply to this screen: the shell, rail and palette (D-5, done in `shell-rail-palette`), Work and tickets (D-6, D-7, D-8, D-9, D-10, D-11, D-12), the Inbox (D-13, D-14, D-15), todos and compliance dates (D-16), Money (D-17) and the lead profile (D-20).

## Open questions

- none
