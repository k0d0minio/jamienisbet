# Stub: Stop the board reading the whole estate to draw five rows

- feature-slug: board-read-cost
- priority: P2
- size: M

## What this is

The 403 outage of 2026-08-29 was a caching bug (fixed: `force-dynamic` on `/` and
`/tickets` was overriding the board's 60-second revalidate, and the reads never
opted into the Data Cache at all because they carry an Authorization header).
The cache is back and the fan-out is capped at 8 concurrent requests, so the
board is inside GitHub's limits again. What the fix did **not** touch is how
expensive one cold read is, and that is what left so little headroom.

Two costs worth cutting:

- **The roster is every repo the token owns.** `loadRepos()` folds in
  `listAccessibleRepos()` — ~33 repos — and each one costs a recursive tree call
  whether or not it has ever had an `.icm/intake/`. Most never will. Consider
  remembering which repos have an intake (a `biz.*` column, or simply trusting
  the client rows plus the pinned house repos) and treating the full-owner sweep
  as a periodic discovery pass rather than something every render pays for.
  Note the constraint before changing this: showing the whole estate on one
  board is deliberate (icm-board decision D13), so the roster must not silently
  shrink to "repos with a client row".
- **Home pulls the whole board for the now-strip.** `loadTickets()` in
  `app/(app)/page.tsx` calls `listBoard()` and uses `board.strip` — five rows at
  most — discarding every section it just paid for. With the cache restored the
  two screens share their reads, so this is no longer urgent; it is still the
  whole estate fetched to render a short list on the app's landing screen.

Also worth a look while in here: `listAccessibleRepos()` swallows its own
failures and returns `[]`, which is exactly why the outage read as "these
repos are broken" instead of "the token is rate-limited" — the roster had
already quietly halved before a single tree call ran.

## Prompt

Read `.icm/intake/triage/board-read-cost.md` and `websites/admin-dashboard/lib/tickets.ts`
in the jamienisbet repo. Cut what one cold read of the tickets board costs in
GitHub requests, without shrinking what the board shows (icm-board decision D13:
the whole estate on one board). Look at the two costs the stub names — the
every-owned-repo roster and home pulling the full board for the now-strip — and
at `listAccessibleRepos()` returning `[]` on failure rather than saying it
failed.

Keep the caching invariants in the header of `lib/tickets.ts` intact: reads stay
`cache: "force-cache"`, and no route reading the board may export
`dynamic = "force-dynamic"`. CI is the source of truth — don't run builds
locally. Work on a `claude/` branch, push, open a PR, and `git mv` this stub to
`.icm/intake/triage/_done/` in that PR.
