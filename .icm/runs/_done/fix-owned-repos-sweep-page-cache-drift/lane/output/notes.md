# Bug: fix-owned-repos-sweep-page-cache-drift

- observed: `fetchOwnedRepos`'s sweep pages `/user/repos` sorted by `pushed`, and each page URL is
  cached on its own hourly clock (`DISCOVERY_REVALIDATE_SECONDS`); a `pushed` sort reorders the
  whole list on every push in the estate, so a repo that crosses the page-100 boundary between two
  pages cached at different times shows up on both pages (a duplicate board group, doubled
  tickets, duplicate React keys) or on neither (missing for up to an hour) · expected: the sweep's
  page partition is stable regardless of when each page's cache entry was last filled, and no repo
  full name repeats
- reproduction (code path): `fetchOwnedRepos` in `websites/admin-dashboard/lib/tickets.ts` — each
  page goes through `gh(path, accept, DISCOVERY_REVALIDATE_SECONDS)`, and nothing de-duplicated
  `fullNames`. Only reachable once the token sees more than 100 repos (the estate is ~35 today, per
  the stub); the fix holds regardless of when that line is crossed.
- cause: paginating a sort key (`pushed`) that moves on every push, combined with per-page caching
  on independent clocks
- fix: `websites/admin-dashboard/lib/tickets.ts` → `fetchOwnedRepos`: `sort=pushed` →
  `sort=full_name&direction=asc` (a sort that never reorders itself between two reads), and dedupe
  `fullNames` (`[...new Set(fullNames)]`) on the way out. Checked `listAccessibleRepos` in
  `lib/github.ts` — it calls `gh(path)` with `cache: "no-store"` (always live, no revalidate), so
  left alone as the stub said to.
- changelog: announce: none (not yet observable in production — the estate is under the 100-repo
  page boundary today; the fix holds the line before it's crossed)
- learned: none
