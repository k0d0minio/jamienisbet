# Tasks: board-client-state

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [x] Tapping a repo chip on `/tickets` filters the board instantly with no server request for
- [x] Browser back/forward after chip taps step through the previous filters, with the board
- [x] Opening `/tickets?repo=<slug>` directly (and from a Needs you "Today's tickets" row)
- [x] The masthead figures and chip counts reflect the active filter exactly as they do today.
- [x] The server response for `/tickets` carries ticket bodies as raw markdown, not rendered
- [x] Every launcher on the board — ticket Copy split button, Copy next, Recut, repo
- [x] An "as of HH:MM" stamp (Europe/Lisbon) sits beside the refresh control and shows the
- [x] The refresh button still busts the cache and re-reads; the board stays on screen during
- [x] Returning to the tab after ≥5 minutes hidden re-reads the board in the background without
- [x] The silent re-read busts only the position (repo-tree) reads: discovery and blob reads
- [x] If a silent or manual refresh removes a ticket whose sheet/peek is open, that view closes
- [x] `lib/tickets.ts` still opts every GitHub read into `force-cache`, keeps its three clocks
- [x] The first visit to `/tickets` still shows `loading.tsx` while the board is read.
- [ ] The board looks the same as before on phone and desktop (Vercel preview check).
- [ ] CI green: Typecheck + lint and Build admin-dashboard.

## Queue

- [x] Pass 1 — serialisable board: `readBoard()` + `BoardData` types, position cache tag (`lib/tickets.ts`) — b8a6fb4
- [x] Pass 2 — URL-state hook `components/use-board-params.ts` (`repo` wired, `t` held) — b8a6fb4
- [x] Pass 3 — client root `components/tickets-board.tsx` + `BoardFigures`; `Chip` a button; `page.tsx` reads once — b8a6fb4
- [x] Pass 4 — `TicketDetail` client-side, markdown loaded on demand — b8a6fb4
- [x] Pass 5 — `BoardRefresh`: as-of stamp, quiet re-read on return via `refreshBoardPosition` — b8a6fb4
- [ ] Pass 6 — CI green on the draft (cheap tier), then ready flip + full gate + previews
