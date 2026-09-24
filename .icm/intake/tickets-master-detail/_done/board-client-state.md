# Stub: Load the board once, filter and select on the client

- feature-slug: board-client-state
- sequence: 1 of 6
- depends-on: none
- priority: P1
- size: M

## What this is

The reason the board feels slow: every repo-chip tap is a server navigation that re-runs
`listBoard()` and re-streams every ticket, pre-rendered. This stub moves the board to
"read once, interact locally".

- **One read, plain data.** `app/(app)/tickets/page.tsx` stays the server entry: it
  awaits `listBoard()` once and hands a serialisable board (repos, sections, tickets
  with their raw markdown `body`, launch sets, errors) to a client root component. Ticket
  bodies are rendered client-side by `components/markdown.tsx` only when a ticket is
  shown — no more server-rendering every body into the payload.
- **Repo filter is client state.** The chip rail filters in memory. URL state (`?repo=`,
  and the selection param stub 2 will use, e.g. `?t=<repo>/<epic>/<slug>`) is written
  with `window.history.pushState`/`replaceState`, which Next's App Router integrates
  with `useSearchParams` *without* a server round-trip. Back/forward work. No `<Link>`
  navigation on the board for filter or selection.
- **Freshness = manual + on return.** `BoardRefresh` keeps its behaviour (bust the tag,
  re-read). New: on `visibilitychange` → visible after ≥5 minutes hidden, re-read
  silently — keep the current board on screen, swap data when it lands, keep the filter
  and selection (drop the selection only if that ticket no longer exists). Never show
  `loading.tsx` for a refresh. Whether the silent re-read is `router.refresh()` or a
  server action returning the board is the builder's call — whichever keeps selection
  state and never flashes the skeleton.
- **"As of HH:MM"** — the time of the read the board is showing, set small beside the
  refresh control (Europe/Lisbon, the operator's clock).
- `loading.tsx` remains for the first load only.

Invariants that must survive untouched: the cache header of `lib/tickets.ts`
(`force-cache` on every read, no `dynamic = "force-dynamic"` on any route reading the
board, the concurrency cap), the read-only contract, launcher URL shapes.

## Prompt

Read `.icm/intake/tickets-master-detail/breakdown.md`, then this stub
(`.icm/intake/tickets-master-detail/board-client-state.md`), then the header comment of
`websites/admin-dashboard/lib/tickets.ts` and `websites/admin-dashboard/app/(app)/tickets/`.

Make the Tickets board load once and interact locally: a client root fed a serialisable
board from `listBoard()`; the repo filter and selection kept as URL state via
`history.pushState` (no server navigation); ticket markdown rendered client-side on
demand; a silent background re-read when the tab returns after ≥5 minutes; an "as of"
stamp by the refresh button. Keep the current visual layout for now — stub 2 redesigns
it. Do not break the cache invariants in `lib/tickets.ts`.

Follow the `design-dna` skill. Work on a `claude/` branch, open a PR, let CI verify
(never build/lint/typecheck locally), check the Vercel preview on phone and desktop.
In the same PR, `git mv` this stub to `.icm/intake/tickets-master-detail/_done/`.
