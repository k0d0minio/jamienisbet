# Stub: The repo sweep's pages are cached one by one and can duplicate or drop a repo

- lane: bug
- found-by: launcher-registry Release code review · 2026-09-23
- complexity: medium
- priority: P3
- size: S
- sources: `websites/admin-dashboard/lib/tickets.ts` → `fetchOwnedRepos` (from #137)

## Problem

`fetchOwnedRepos` pages `/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator`,
and each page goes through `gh(…, DISCOVERY_REVALIDATE_SECONDS)`, so each page URL is cached on
its own hourly clock. The list is sorted by last push, so a page cached at 10:00 and a page
cached at 10:40 describe different orderings: a repo that moved across the page-100 boundary
between them shows up on both pages (a duplicate board group, doubled tickets, duplicate React
keys) or on neither (missing for up to an hour). Nothing de-duplicates `fullNames`.

Only reachable once the token sees more than 100 repos (the estate is ~35 today); adding
collaborator repos (#137) moves that line closer.

## Prompt

In this repo, make the Tickets board's repo sweep (`fetchOwnedRepos` in
`websites/admin-dashboard/lib/tickets.ts`) immune to per-page cache drift. Smallest fix that
holds: de-duplicate `fullNames` (keep first occurrence), and make the listing order stable by
sorting on something that does not move (`sort=full_name`, direction `asc`) so pages cached at
different times still partition the same list. Check `listAccessibleRepos` in `lib/github.ts`
uses the same pattern uncached (it calls `gh(path)` without a revalidate) and leave it alone if
so. Don't run build/lint/typecheck locally — CI is the source of truth. Ship through the bug
lane.
