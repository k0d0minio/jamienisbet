# Plan: leads-table-board

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Data and ordering** — `lib/leads.ts`: one comparator per sortable column (name, status by
   `clientStatuses` order, stage by code, value by the headline's euro amount, next, due, last,
   tier), empties last in both directions, stable over the view's default order; URL parsing for
   `sort` / `dir` / `layout` that ignores unknown values. `lib/deals.ts`: `dealStages()` also
   reports whether the tree was read (e.g. `{ stages, readable }`), cache untouched — done when:
   the page can sort any population by any column and tell "no folder" from "could not read".
2. **The page frame** — `app/(app)/leads/page.tsx`: `desk-tier` root, `AppScreen wide` (or the
   desk equivalent) at `md+`; the 56px header (title, totals line, Table / Board switch,
   Prospects with pool count, Archived, Add lead); the filter bar with population filters, the
   divider and the two crack filters with counts; every link keeps view / archived / filter or
   crack / layout / sort — done when: every header and filter control navigates to the right URL
   and the crack view behaves as today.
3. **The table** — `components/leads-table.tsx` (client): `DataGrid` with the nine columns, header
   sort links/buttons (URL push, `aria-sort`), row click → profile, the three row actions (Restore
   / Delete in the archived view), the j / k / Enter / t handler with the palette / dialog /
   field / modifier guards; delete `components/client-status-select.tsx` — done when: the table
   ACs pass at 1440 and 768 wide.
4. **The board** — `components/deal-board.tsx` (server-renderable): No folder + 01–08 columns with
   counts, cards (name, figure, next step, due / waiting / status foot) as profile links, the
   unreadable-stages note — done when: the board ACs pass with and without `GITHUB_TOKEN`.
5. **Phone rows and states** — restyle the row markup in `page.tsx` + `components/lead-row.tsx`
   to the desk tier (flat, hairlines, 44px, desk type), keeping `SwipeRow` and its trays
   untouched in behaviour; `deal-stage-chip.tsx` / `deal-badges.tsx` left as they are (shared
   with the profile, which `lead-profile-columns` owns — Build, 2026-09-25); the empty, closed-crack and DB-error states; `loading.tsx` skeleton for both widths —
   done when: at 390 wide the rows swipe as before and nothing app-tier shows below the title bar.
6. **README** — `websites/admin-dashboard/README.md` § Leads and the Layout tree — done when: it
   describes the shipped screen and nothing it replaced.

## Risks

- **The deal-folder cache.** `lib/deals.ts` fetches must keep `cache: "force-cache"` and the tag;
  no `dynamic = "force-dynamic"` on the route (read the header of `lib/tickets.ts`). Sign: GitHub
  rate-limit errors, or the stage column blank on every other load.
- **`view` is already taken.** It means the population (`view=prospects`); the layout is
  `layout=board`. Every `hrefFor` must carry all five params, or a filter click drops the sort or
  the layout.
- **Two renders of one list.** The desk table and the phone rows both exist in the page; keep the
  server work shared (one read, one sort) and hide by breakpoint, or the page does the read twice.
- **Keyboard collisions.** `t` / `j` / `k` must not fire in the create sheet, the palette, or
  while ⌘K is pressed; mirror the guards `use-board-keys.ts` already has.
- **Overlap.** `lead-profile-columns` edits the profile and may touch `deal-stage-chip.tsx` /
  `deal-badges.tsx` in parallel — keep changes there to tokens, no API change.
