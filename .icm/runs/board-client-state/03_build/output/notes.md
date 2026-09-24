# Build notes: board-client-state

- commits: b8a6fb4 feat (the change), e90bae9 notes, c30d339 ready
- ci: GREEN on c30d339 — full gate (ready): Typecheck + lint, Build admin-dashboard/portfolio/sellers-site, Vercel – jamie-nisbet, Vercel – portfolio

## What changed

- `websites/admin-dashboard/lib/tickets.ts`: `BOARD_POSITION_TAG` on the position clock's reads
  only (repo trees + today list; every read keeps `BOARD_CACHE_TAG`) — D-3. New `readBoard()` →
  `BoardData`: `listBoard()` made serialisable — bodies as raw markdown, launch sets prebuilt
  per ticket / epic / repo / estate (this module is `server-only`), chip counts instead of the
  full `tickets` array, a batch's `next` reduced to `{title, pickup}`, and `readAt`. Clocks,
  cap, parsing and `listBoard()`/`listStrip()` untouched.
- `app/(app)/tickets/page.tsx`: reads once (`connection()` keeps it request-time without
  `force-dynamic`) and hands the board to the client root; the unconfigured state stays a
  server render.
- `app/(app)/tickets/actions.ts`: `refreshBoardPosition()` — `updateTag(BOARD_POSITION_TAG)`.
- `components/tickets-board.tsx` (new, client): the board's markup moved out of `page.tsx`
  unchanged; filter derived in memory from `?repo=`. `BoardFigures` (the masthead's glance
  row) reads the same URL param on its own, so the masthead stays in `AppScreen`.
- `components/use-board-params.ts` (new): `repo`/`t` via `useSearchParams` + `history.pushState`;
  only `repo` has a consumer (D-1).
- `components/chip.tsx`: `Chip` is a `<button aria-pressed>` with `onClick` (its only consumer is
  the board); `ArchiveChip`/`ProspectsChip` untouched.
- `components/ticket-detail.tsx`: client component; `Markdown` loaded with `next/dynamic`, so
  react-markdown ships as a split chunk fetched with the first opened ticket.
- `components/board-refresh.tsx`: "as of HH:MM" (`<time>`, mono, Europe/Lisbon-pinned
  `Intl.DateTimeFormat`, so SSR and client agree) before the button; a `visibilitychange`
  listener re-reads quietly (`refreshBoardPosition` + `router.refresh()` in a transition, no
  spinner) after ≥5 min hidden. `readAt` optional so `loading.tsx` still renders the bare button.
- Comments in `batch-row.tsx`, `board-ticket-row.tsx`, `ticket-peek.tsx`, `markdown.tsx`,
  `loading.tsx` updated where they described server-rendered children / force-dynamic.

## Acceptance criteria status

- [x] Chip tap filters with no server request / skeleton; URL `?repo=` — `Chip` onClick → `pushState`; no `<Link>` on the filter path.
- [x] Back/forward step through filters — `pushState` entries; App Router syncs `useSearchParams`.
- [x] Direct `/tickets?repo=<slug>` and Home's deep link filter; unknown value → whole board — `useRepoFilter` validates against the roster, as before.
- [x] Masthead figures and chip counts follow the filter — same derivations, moved client-side.
- [x] Raw markdown in the payload; body renders on open — `TicketDetail` only mounts inside an open row/sheet (Radix unmounts closed content); `Markdown` lazy.
- [x] Launchers unchanged — the same `launchesForTicket`/`recutLaunches`/`repoMaintenanceLaunchers`/`estateCheckLaunches` outputs, prebuilt on the server.
- [x] "As of HH:MM" beside refresh, advances on refresh — `readAt` set when `readBoard()` resolves; new props on every refresh.
- [x] Refresh busts all and keeps the board on screen and state — behaviour unchanged (transition + `router.refresh()`); client state survives since the tree keys are stable.
- [x] Return after ≥5 min re-reads quietly; <5 min does nothing — `RETURN_AFTER_MS`.
- [x] Quiet re-read busts only position reads — `BOARD_POSITION_TAG` is on `REVALIDATE_SECONDS` reads only.
- [x] Vanished ticket's open view closes — rows/peeks/batches are keyed by path/slug and unmount with their data.
- [x] Cache invariants — `force-cache` untouched, three clocks and the cap untouched, no `dynamic` export on `/tickets` or `/`.
- [x] `loading.tsx` on first visit only — unchanged file (comment only); refreshes run in transitions.
- [ ] Looks the same on phone and desktop — preview smoke (operator).
- [x] CI green — full gate on c30d339.

## Notes for Release

- D-3 is a spec gap Build found and the operator settled (spec revised mid-Build; Spec approved
  re-ticked): an un-busted re-read after the revalidate window returns the stale entry.
- The payload still repeats a today/blocked stub's body in the now-strip and its batch (as the
  server-rendered trees did before); stub 2 retires the strip.
- Review closely: `BoardRefresh`'s effect (listener lifetime, the quiet transition) and that no
  hydration warning comes from the as-of stamp on the preview.
- The first full-gate read after the post-flip push settled on the pre-push head (e90bae9);
  re-read on c30d339 — see `error.log`. Template change parked:
  `.icm/intake/triage/template-change-ci-status-stale-head.md`.
