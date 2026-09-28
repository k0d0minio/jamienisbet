# Chore: gates-graphql-cache-entry-size

- invariant: no user-facing behaviour changed — the Inbox's gate rows read the same; only how
  `lib/gates.ts` fetches each PR's `body` from GitHub's GraphQL API differs.
- change: `websites/admin-dashboard/lib/gates.ts`: dropped `body` from the `gatePulls` fragment
  (the query that also carries up to 30 PRs' × 60 check contexts, deployments and labels per
  repo, chunked `REPOS_PER_QUERY` repos at a time) and added `readPrBodies`, a second, narrower
  query — one `pullRequest(number:)` alias per PR, chunked the same way `readRunStatuses` chunks
  its own follow-up read — cached under its own tag as its own cache entry. `readGates` now
  populates `pr.body` from that answer before `gateTicked`/`isLanePr`/`runSlugOf` run. A
  Dependabot or pipeline PR's long body (the release notes, the spec table) no longer rides
  bundled inside the checks-heavy `gatePulls` answer, which is what was pushing some chunks'
  cached answer past Next's 2 MB per-entry limit ("items over 2MB can not be cached") and forcing
  a GitHub re-query on every Inbox render.
- rollback: revert the commit — `body` goes back into `PR_FIELDS`, `readPrBodies` and its call
  site are removed. Forward-only concern: none: this is a pure read-path change, no schema or
  stored data involved (`migrations.reversible` is not applicable here).
- learned: none
