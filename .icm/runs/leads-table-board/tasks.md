# Tasks: leads-table-board

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

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

## Queue

- [x] Sort helpers and the readable-stages signal (`lib/leads.ts`, `lib/deals.ts`)
- [x] Table + layout switch (`components/leads-table.tsx`)
- [x] Board (`components/deal-board.tsx`)
- [x] Page: header, filter bar, desk and phone trees (`app/(app)/leads/page.tsx`), Add lead desk trigger, status select deleted
- [x] Phone rows + tray on the desk tier, loading skeleton
- [x] README § Leads
- [ ] Ready flip, full gate green

- [ ] <task — small enough for one commit; name the file or area>
