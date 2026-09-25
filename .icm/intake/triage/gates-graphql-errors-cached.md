# Stub: The gates read caches GitHub's error answers for a minute

- lane: bug
- found-by: release gates-read · 2026-09-25
- complexity: low

## Problem

`githubGraphql` (`websites/admin-dashboard/lib/tickets.ts`) reads with `force-cache`, and GraphQL
answers HTTP 200 even for a rate limit (`{data: null, errors: [{type: "RATE_LIMITED"}]}`) or a
transient per-repo error. `gh()`'s "only 200s are stored" safety does not hold here, so a failed
answer is served for the next 60 s: the Inbox group reads "Couldn't read GitHub" (or a repo as
unreadable) on every render and badge after GitHub has recovered, until the refresh control is
used.

## Proposed change

Keep error answers out of the cache — for example, read with `no-store` first when the previous
answer carried errors, or bust `GATES_CACHE_TAG` from a route handler the client calls when the
group lands failed — so a failure is re-asked on the next render.
