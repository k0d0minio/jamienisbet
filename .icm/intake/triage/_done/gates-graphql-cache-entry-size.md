# Stub: A gates GraphQL answer can outgrow Next's 2 MB cache entry

- lane: chore
- found-by: release gates-read · 2026-09-25
- complexity: medium

## Problem

One cached answer in `websites/admin-dashboard/lib/gates.ts` covers up to 10 repos × 30 PRs with
each PR's full `body`, 60 check contexts, labels and deployments. Past 2 MB Next logs "items over
2MB can not be cached" and every render re-queries GitHub, breaking the "warm Inbox makes no
GitHub request" budget — most likely with many Dependabot PRs (long release notes) or pipeline PRs
(spec tables).

## Proposed change

Shrink the answer: lower `REPOS_PER_QUERY`, or stop fetching `body` whole (read only the gate
lines and slug the classifier needs, e.g. a second, narrow query for pipeline PRs).
