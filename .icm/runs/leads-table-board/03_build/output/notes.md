# Build notes: leads-table-board

- commits: feat (table, board, page, phone rows, skeleton, README) · chore (run files)
- ci: GREEN on b20a11e (full gate: Quality (advisory) pass; every Vercel project skipped the empty ready commit as not affected — the admin preview of this code is the branch alias, built and passed on the pre-flip head)

## What changed

- `lib/leads.ts`: `leadSortKeys`, `parseLeadSort`, `firstDirection`, `dueOf` and `sortLeads` — one comparator per column, blanks last in both directions, stable over the view's default order.
- `lib/deals.ts`: `dealStages()` now returns `{ stages, readable }`, so "no folder" and "could not read icm-board" are told apart; fetch caching untouched (`force-cache`, 60 s tree, the tag).
- `app/(app)/leads/page.tsx`: one read, one sort, two trees. Desk (from `md`): a full-height desk `Pane` — header (title, cash totals line, Table / Board, Prospects with the pool count, Archived, Add lead), a filter bar (population filters, a hairline, the two crack filters with counts; a crack's blurb and Back to Leads), the DB-error line, then the table or the board. Phone: the shell's `AppScreen` title bar over flat, full-bleed desk-tier rows with the same swipes. Every control is a link built from one `leadsHref` that carries `view` / `archived` / `filter` or `crack` / `layout` / `sort` / `dir`.
- `components/leads-table.tsx` (new, client): the `DataGrid` with the nine columns, header sort (URL push, `aria-sort`), row click → profile, WhatsApp / Email / Mark touched (Restore / Delete in the archive, optimistic), and j / k / Enter / t with the palette / dialog / field / modifier guards; plus `LeadsLayoutSwitch` on `DeskSegmentedControl`.
- `components/deal-board.tsx` (new, server): No folder + 01–08 columns with counts, cards as profile links (`draggable={false}`), the one-line unreadable note.
- `components/client-create-form.tsx`: a `trigger="desk"` form — one `DeskButton` "Add lead" — beside today's `bar` triggers.
- `components/lead-row.tsx`: the swipe-right commit takes the desk ink instead of the app tint.
- `components/client-status-select.tsx`: deleted (no caller left); two comments that pointed at it now point at `lead-status-row.tsx`.
- `app/(app)/leads/loading.tsx`: a desk-tier skeleton of both layouts.
- `README.md` § Leads, the screens table and the Layout tree.

## Acceptance criteria status

- [x] Table with the nine columns from 768px — `hidden md:flex` desk tree, `DataGrid` with a `colgroup`; the pane spans the content area.
- [x] Header sort, reversing, `sort` + `dir` in the URL, server-side; no param = longest-waiting first — `sortHrefs`, `sortLeads`, `shownSort`.
- [x] `aria-sort` + arrow (the `DataGridHeaderCell` contract); blanks last both ways — `sortLeads`.
- [x] Row click → profile; WhatsApp / mailto / Mark touched with toast, not opening the profile — the row's click handler skips `a, button`.
- [x] Archive view: Restore / Delete (confirm); no live row carries status, archive or delete; `client-status-select.tsx` deleted.
- [x] j / k / Enter / t with the guards — desk query, `OVERLAY`, `TEXT_FIELD`, `ACTIVATABLE`, any modifier.
- [x] Table / Board on every view, `layout=board` kept with the rest — `LeadsLayoutSwitch`, `leadsHref`.
- [x] Board columns with counts; stage from `dealStages()`; No folder for the rest; same rows as the table — `DealBoard` is fed `rowViews`.
- [x] Cards: name, figure, next step, due / waiting / status foot; links; not draggable; no writes.
- [x] No `GITHUB_TOKEN`: stage cells `—`, every card under No folder, one-line note — `readable: false`.
- [x] Cash-only totals as today, non-zero only, none on prospects or cracks — `totals()` unchanged; `figures` empty for `cold || crack`.
- [x] Population filters with counts that add to All; Nothing planned / Gone quiet counts equal their views — both counted with `CRACKS[*].matches` over the same non-archived read.
- [x] Prospects / Archived switches, crack views with blurb and Back to Leads, Add lead — as today.
- [ ] Below 768px: rows on the desk tier, ≥44px, swipes unchanged — built (`min-h-desk-row`, `LeadRow` untouched in behaviour); needs the operator's phone smoke.
- [ ] Empty / closed-crack / DB-error states on the desk tier; skeleton matches both widths — built; needs the smoke.
- [ ] Light and dark — built from desk tokens only; needs the smoke in both themes. No `force-dynamic` under `app/(app)/leads` — true (`grep`).
- [x] README § Leads rewritten; "the wide table is gone" removed.
- [x] CI lint / typecheck / build and the admin preview — Quality (advisory) pass on b20a11e; `Vercel – jamie-nisbet` built and passed on the pre-flip head (same code).

## Notes for Release

- **The PR body's criteria boxes are unticked.** Build's re-render to tick them was refused (it also rewrites the gate lines — FAILURE.md); this file is the criteria status.

- **Spec gaps Build decided (decisions.md D-36, D-37):** the Prospects button shows the pool's size only where the read holds it (not in the archive or a crack view); a not-won lead now reads muted on the phone too, matching the table's rule.
- **Left as they are:** `deal-stage-chip.tsx` and `deal-badges.tsx` keep their current look on the phone row's third line — they are shared with the lead profile, which `lead-profile-columns` owns; restyling them here would have been an edit under another live run.
- A wake date past due reads red in the Due column, the same as a slipped next step (the spec's "red once past" applied to both).
- Look closely at `components/leads-table.tsx` → the keyboard effect (attached once, reads through `keyState`) and the optimistic `gone` set.
- The desk pane is `h-dvh` with `md:-mb-8` to take back the shell's desk bottom padding; if the shell's `md:pb-8` changes, this must follow.
- Context budget: read the design canvas's `LeadsDesk.dc.html` in Define; Build read `use-board-keys.ts` for the guard pattern.
