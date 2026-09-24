# Plan: board-client-state

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **The serialisable board** — `websites/admin-dashboard/lib/tickets.ts` (a `BoardData`
   type + a `readBoardData()`/`serialiseBoard()` beside `listBoard()`; `listBoard` itself and
   the fetch layer untouched), or a small `app/(app)/tickets/board-data.ts` server module —
   build one plain object: `listBoard()`'s output + per-ticket `launches`
   (`launchesForTicket`), per-epic `recut` (`recutLaunches`), per-repo `maintenance`
   (`repoMaintenanceLaunchers`), `estateCheck` (`estateCheckLaunches`), and `readAt` (ISO
   string, taken when `listBoard()` resolves). Check every field is JSON-serialisable
   (no functions, Dates, Maps). — done when: the type compiles and nothing on the page
   changes yet.
2. **The URL-state hook** — `websites/admin-dashboard/components/` (e.g.
   `use-board-params.ts`, `"use client"`): reads `repo` and `t` from `useSearchParams()`,
   exposes `setRepo(slug | null)` / `setTicket(id | null)` that write via
   `window.history.pushState` (keeping the other param), so App Router's `useSearchParams`
   re-renders without a server request. `t` has no UI consumer this run. — done when: the
   hook is used by pass 3 for `repo`.
3. **The client root** — a new `components/tickets-board.tsx` (`"use client"`) receiving the
   `BoardData`: owns the filter derivation (visible sections, strip, figures, chip counts —
   the logic currently in `page.tsx`), renders the existing chip rail / error group / Now
   strip / repo sections / BoardGroup / empty states with the same markup. `Chip` gets a
   button (onClick) form alongside its `href` form rather than a board-specific fork; the
   empty-repo "show the whole board" link becomes `setRepo(null)`. `page.tsx` shrinks to:
   metadata, the unconfigured branch, `await` the board data, render `AppScreen` + client
   root. Masthead figures depend on the filter, so the masthead moves into the client root
   (or `AppScreen`'s masthead/actions are fed from a client wrapper) — keep the rendered
   markup identical. Keep the `force-dynamic` comment. — done when: chip taps filter with
   no RSC request and back/forward work.
4. **Client-side markdown on demand** — `components/ticket-detail.tsx` becomes client-safe
   (it already only takes `ticket` + `launches`); `BatchRow`/`BoardTicketRow`/`TicketPeek`
   render it themselves when expanded/open instead of receiving it as server `children`.
   `Markdown` is loaded with `next/dynamic` (or `React.lazy`) inside `TicketDetail` so
   `react-markdown` + `remark-gfm` land in a split chunk. Update the now-stale "Pure render,
   no client JS" / "Server-rendered and passed into the client shells" comments. — done
   when: the `/tickets` RSC payload carries raw `body` strings and expanded tickets render
   with `.prose` styling.
5. **Freshness** — `components/board-refresh.tsx` + the client root: an `as of HH:MM` stamp
   (`Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone:
   "Europe/Lisbon" })` on `readAt`; render it client-side after mount or with
   `suppressHydrationWarning`-free deterministic formatting — the formatter is
   timezone-pinned, so SSR and client agree) beside the refresh button, in the bar's
   material label colour, small. Silent re-read: a `visibilitychange` listener records
   `hiddenAt`; on visible with `now - hiddenAt ≥ 5 min`, a new server action
   `refreshBoardPosition()` (`updateTag(BOARD_POSITION_TAG)`), then `startTransition(() =>
   router.refresh())`. In `lib/tickets.ts`, the fetch helper adds `BOARD_POSITION_TAG` to
   the tags of reads on the `REVALIDATE_SECONDS` (position) clock only — every read keeps
   `BOARD_CACHE_TAG`, so the manual refresh still busts all three (D-3). `router.refresh()` inside a transition keeps client
   state and does not fall back to `loading.tsx`; verify. If a sheet/peek's ticket vanishes
   after new props land, close it (derive open state from "id still present"). — done when:
   the refresh ACs in the spec hold on the preview.
6. **Invariants + tidy** — grep `force-cache`, the concurrency cap and `force-dynamic` across
   `app/(app)/tickets` and `lib/tickets.ts`; remove imports nothing uses; README Tickets
   section is Release's to update. — done when: CI green (Typecheck + lint, Build
   admin-dashboard) and the preview matches the old layout on phone and desktop.

## Risks

- **`router.refresh()` flashing `loading.tsx`** — a refresh outside a transition can suspend
  the segment. Signal: skeleton visible on refresh in the preview. Fallback: a server action
  returning `BoardData` held in client state (`useState` seeded from props).
- **Hydration mismatch on the as-of stamp** — signal: React hydration warning in the console.
  The Lisbon-pinned formatter should avoid it; else render after mount.
- **RSC payload size** — raw markdown for the whole estate still ships once; it is smaller
  than the rendered trees it replaces, but check the `/tickets` document size on the preview
  isn't larger than before.
- **Sheet `children` coupling** — `BatchRow` currently receives `BoardTicketRow` + server
  `TicketDetail` as children; moving the render client-side may need `BatchRow` to take
  tickets as data. Keep the visual output identical; stub 2 retires these anyway, so don't
  over-refactor.
- **Cache invariant regressions** — any new server module that reads the board must not add
  `export const dynamic`. Signal: the grep in pass 6.
