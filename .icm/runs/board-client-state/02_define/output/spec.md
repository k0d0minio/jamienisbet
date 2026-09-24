# Spec: Load the Tickets board once, filter and select on the client

- slug: board-client-state
- personas: operator
- touches: websites/admin-dashboard/app/(app)/tickets, websites/admin-dashboard/components, websites/admin-dashboard/lib/tickets.ts
- complexity: standard

## Problem

The Tickets board (`/tickets` in the admin dashboard) feels like a reload on every tap because
it is one: each repo chip is a `<Link href="/tickets?repo=…">`, so a filter tap is a server
navigation that flashes `loading.tsx`, re-runs `listBoard()` (a Neon roster read every time,
GitHub tree reads whenever the 60 s clock lapsed) and re-streams the whole estate — every
ticket's markdown pre-rendered on the server, including the ones never opened. This is stub 1
of the `tickets-master-detail` epic (breakdown decisions 4 and 7): it moves the board to "read
once, interact locally" so the operator's glance at the estate is instant, and gives the
master–detail redesign (stub 2) a proven client-side data layer to sit on.

## Proposed change

- **One read, plain data.** `app/(app)/tickets/page.tsx` stays the server entry. It awaits
  `listBoard()` once and hands a serialisable board to a new client root component: repos,
  sections and batches, tickets with their raw markdown `body`, the now-strip, read errors
  (`errors`, `rosterError`, `dbError`), every launch set the UI needs precomputed on the
  server (per ticket `launchesForTicket`, per epic `recutLaunches`, per repo
  `repoMaintenanceLaunchers`, the estate check) because `lib/tickets.ts` is `server-only`,
  and the read time (below). The unconfigured (`GITHUB_TOKEN` missing) state stays a server
  render as today.
- **Ticket bodies render on the client, on demand.** `components/markdown.tsx` renders a
  ticket's body only when that ticket is shown (a batch sheet's stub expanded, a now-strip
  peek opened). `TicketDetail` stops being passed pre-rendered as server children; the
  markdown renderer is loaded lazily so it does not weigh on the board's first paint.
- **Repo filter is client state.** The chip rail filters in memory — sections, now-strip,
  masthead figures (Today / Blocked / Open) and chip counts all derive from the one board.
  The filter is written to the URL as `?repo=<slug>` with `window.history.pushState` (Next's
  App Router syncs `useSearchParams` with it without a server round-trip); back/forward move
  between filters. No `<Link>` navigation on the board for filtering. An unknown `?repo=`
  reads as "All", as today. The "show the whole board" link in the empty-repo state clears
  the filter the same way. Home's existing `/tickets?repo=<slug>` deep links keep working.
- **A board URL-state hook**, used by the client root, owning the board's search params:
  `repo` (wired here) and `t` (the ticket selection, `?t=<repo>/<epic>/<slug>` — read and
  written by the hook, but **not wired to any UI in this run**; stub 2 wires it). Open batch
  sheets, expanded rows and now-strip peeks stay component state, as today.
- **Freshness = manual + on return.** `BoardRefresh` keeps its behaviour: bust the tag
  (`refreshBoard` → `updateTag`), then re-read. New: when the tab/PWA becomes visible
  (`visibilitychange`) after ≥5 minutes hidden, the board re-reads silently in the
  background — the current board stays on screen, the new data swaps in when it lands, the
  repo filter and any open sheet/expanded ticket are kept (a sheet or ticket whose ticket no
  longer exists closes). The silent re-read busts **only the position reads** — the
  one-minute repo-tree calls, given a second cache tag of their own in `lib/tickets.ts` — so
  it costs one tree call per repo with an intake (the minute clock's own cost) and fetches
  only the ticket bodies whose blob SHA changed. Discovery (hourly) and content (by SHA)
  stay cached; only the manual refresh busts everything. (Busting nothing would not work:
  Next's fetch cache answers an expired entry with the stale value and refreshes it in the
  background, so an un-busted re-read after ≥5 minutes away would re-show the board you
  left.) Neither a manual nor a silent refresh ever shows `loading.tsx`;
  it remains for the first load only. Whether the re-read is `router.refresh()` or a server
  action returning the board is Build's call — the constraint is: state kept, no skeleton,
  no layout jump.
- **"As of HH:MM".** Small, beside the refresh control: the time the server's `listBoard()`
  returned for the board currently on screen, formatted `HH:MM` in `Europe/Lisbon`. It
  updates whenever a manual or silent refresh lands. (On a first load it can trail the true
  fetch by up to the one-minute position clock; after a manual or silent refresh, both of
  which bust the position reads, it is exact.)
- **Layout unchanged.** Chip rail, now-strip, repo sections, batch sheets, peeks, swipes,
  maintenance rows and the footnote look and behave as they do today — stub 2 redesigns
  them.

Invariants that must survive untouched: the cache header of `lib/tickets.ts` (`force-cache`
on every GitHub read, no `dynamic = "force-dynamic"` on any route reading the board, the
concurrency cap), the read-only contract (every control is a link or a prompt to copy),
launcher URL shapes.

## Acceptance criteria

- [ ] Tapping a repo chip on `/tickets` filters the board instantly with no server request for
      the page (no RSC fetch in the network panel), no `loading.tsx` skeleton, and the URL
      becomes `/tickets?repo=<slug>`; "All" returns to `/tickets`.
- [ ] Browser back/forward after chip taps step through the previous filters, with the board
      and chip state matching the URL each time.
- [ ] Opening `/tickets?repo=<slug>` directly (and from a Needs you "Today's tickets" row)
      shows the board filtered to that repo; an unknown `repo` value shows the whole board.
- [ ] The masthead figures and chip counts reflect the active filter exactly as they do today.
- [ ] The server response for `/tickets` carries ticket bodies as raw markdown, not rendered
      HTML; a ticket's body renders (with the existing `.prose` styling) when its stub is
      expanded in a batch sheet or its now-strip peek is opened.
- [ ] Every launcher on the board — ticket Copy split button, Copy next, Recut, repo
      maintenance, Estate check — copies/opens exactly what it does today.
- [ ] An "as of HH:MM" stamp (Europe/Lisbon) sits beside the refresh control and shows the
      time of the read on screen; it advances after a manual refresh.
- [ ] The refresh button still busts the cache and re-reads; the board stays on screen during
      it (no skeleton), and the filter and any open sheet are kept.
- [ ] Returning to the tab after ≥5 minutes hidden re-reads the board in the background without
      a skeleton or layout jump, keeping the filter and open sheet, and shows what landed on the
      repos' default branches while away; returning after <5 minutes triggers no re-read.
- [ ] The silent re-read busts only the position (repo-tree) reads: discovery and blob reads
      stay cached, and the manual refresh still busts all three.
- [ ] If a silent or manual refresh removes a ticket whose sheet/peek is open, that view closes
      rather than showing stale content; nothing else changes.
- [ ] `lib/tickets.ts` still opts every GitHub read into `force-cache`, keeps its three clocks
      and its concurrency cap, and no route reading the board exports
      `dynamic = "force-dynamic"`.
- [ ] The first visit to `/tickets` still shows `loading.tsx` while the board is read.
- [ ] The board looks the same as before on phone and desktop (Vercel preview check).
- [ ] CI green: Typecheck + lint and Build admin-dashboard.

## Out of scope

- Master–detail layout, list drilling, deep-linked selection wired to the UI, retiring the
  now-strip / batch sheet / `TicketPeek` (stub 2, `master-detail-shell`).
- Updating Needs you's "Today's tickets" rows to per-ticket deep links (stub 2).
- The ticket, epic, repo and estate views (stubs 3–5); reading `breakdown.md` (stub 4).
- Keyboard navigation (stub 6).
- Search, status or priority facets — the filter is repo only (breakdown decision 4).
- Any change to cache clocks, discovery, or the parsing in `lib/tickets.ts` beyond exposing
  the read time and adding the position reads' second cache tag.

## Open questions

- none — selection wiring (hook only, `?t=` not wired to UI) and the as-of source (server
  read time) settled with the operator in Define, 2026-09-24; the silent re-read busting the
  position reads only settled with the operator at Build, 2026-09-24 (revision).

Context budget: Define read app/(app)/tickets/*, board-refresh.tsx, markdown.tsx and parts of lib/tickets.ts beyond targeted greps, to pin which pieces are server-only.
