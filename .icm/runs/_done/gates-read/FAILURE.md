# Failures: gates-read

The run's retrospective — what cost a turn, and the rule that would have prevented it. Two
files share this job and split it cleanly: `error.log` (in the stage's `output/`) is the ledger
of errors a **tool** reported, written verbatim at the moment of the fix with its `- resolved:`
and `- rule:` lines, which `retrospective.sh` reads and counts across runs; **this file** is
what the run as a whole learned — a wrong assumption, a STOP, a skipped step, a gate that
blocked, a plan that had to be rewritten — which no tool ever logged. On close-out the
`## Learned rules` bullets below are copied into `_shared/project-rules.md` → Learned rules
(`run-pack.sh <slug> --sync-rules`, called by `close-out.sh`, the same shape as
`retrospective.sh --apply`), so the next run in this repo starts with them. Keep the rules
general; keep the retrospectives specific; never restate an `error.log` entry here.

## Retrospectives

### 2026-09-25 — a queued re-run lost to the failed attempt it replaces

- what happened: Release's code review found `signalsOf` (`lib/gates.ts`) picking a check's
  newest attempt by `startedAt`, so a re-run still queued (no start time yet) lost to the old
  failure and the PR stayed Red CI.
- why: the rule was mirrored from `ci-status.sh`'s `sort_by(.started_at, .id)` without asking what
  a not-yet-started attempt looks like.
- fixed by: the review-fix commit on the branch — newest by `databaseId`, start time only when an
  id is missing.

### 2026-09-25 — a GraphQL POST cached like a REST GET

- what happened: the review found `githubGraphql` caching 200 answers that carry only errors
  (rate limit, a per-repo failure) for 60 s; `gh()`'s "only 200s are stored" safety does not
  carry over because GraphQL reports failure inside a 200.
- why: the cache invariants were reused without re-reading what a GraphQL failure looks like.
- fixed by: parked — `.icm/intake/triage/gates-graphql-errors-cached.md`.

## Learned rules

- A GitHub check run's newest attempt is its highest id, not its latest start: a queued re-run has no start time yet.
- A GraphQL call reports failure inside an HTTP 200, so any cache rule that keys on the status code must also read the answer's `errors` before trusting it.
