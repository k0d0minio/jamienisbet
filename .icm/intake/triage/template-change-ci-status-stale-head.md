# Stub: ci-status.sh can settle on the head before the push it was asked about

- lane: chore
- found-by: template-change · 2026-09-24
- priority: P2
- size: S

## Problem

Run `board-client-state`, Build step 12: `git push` of c30d339 (the post-flip push), then
`ci-status.sh board-client-state` immediately. The script's first PR read still returned the
previous head e90bae9 — GitHub had not yet moved the PR — whose checks had all settled, so it
printed `head e90bae9 — settling the full gate (ready)` and `RESULT: GREEN` on the first pass.
The head-moved check in the loop never fires because the verdict is reached before a second
read. A second call a minute later settled correctly on c30d339 (also GREEN). The full-gate
verdict must never rest on the pre-push head; that is the exact case step 11 exists to prevent.

## Prompt

Template change request — from jamienisbet · 2026-09-24

In the icm-board repo (`~/Apps`), change the template-owned file
`_system/template/icm-pipeline/scripts/ci-status.sh` (in every pipeline repo:
`.icm/scripts/ci-status.sh`, a `T` line of the MANIFEST). Read `_system/contracts/PIPELINE.md`
→ File-level ownership first.

What it says today (jamienisbet's copy, `.icm/template-version`: icm-board ef76473):
> head_sha="$(printf '%s' "$pr_json" | jq -r '.head.sha // empty')"

and the settle loop re-reads the head each pass only to catch a push landing *mid*-wait
("Re-read the head each pass: a push landing mid-wait moves the SHA"). Nothing compares the PR's
head with the commit the caller just pushed.

What it should say or do:
When the script runs inside a checkout of the run's branch (`run.md` → `- branch:` equals
`git rev-parse --abbrev-ref HEAD`) and `git rev-parse HEAD` equals
`git rev-parse @{upstream}` (the local head is pushed), treat that SHA as the expected head: if
the PR's `head.sha` differs from it, print `waiting for GitHub to register <sha7> on PR #<n>`
and keep polling the PR (within the existing timeout) until `head.sha` matches, before reading
any signal. On timeout, `RESULT: PENDING` naming the expected SHA. Outside a matching checkout
(or with an unpushed local head) behave as today. Add a fixture case: PR head = old SHA with all
checks green, local pushed head = new SHA → the verdict is not GREEN until the PR head moves.

Why:
jamienisbet run `board-client-state`, Build step 12 (post-flip push c30d339): the first call
returned `RESULT: GREEN` about e90bae9, the pre-push head, because GitHub had not yet moved the
PR. The full gate and the previews are owed on the post-flip head; a GREEN about the previous
head would let Build hand over (and Release merge on) a verdict about code that isn't the
branch. The fix makes the "settled on the pushed head" guarantee hold for every repo.

Then: prove it (the fixture, or a read-only run against projects/jamienisbet on Jamie's machine),
ship it through a PR on a `claude/` branch, and after the merge bring it back with
`_system/scripts/icm-sync.sh --apply projects/jamienisbet` — the other pipeline repos as
`/icm-check` lists them. Do not edit `projects/jamienisbet/.icm/scripts/ci-status.sh` in place.
Retire `projects/jamienisbet/.icm/intake/triage/template-change-ci-status-stale-head.md` to
`_done/` in the sync commit.
