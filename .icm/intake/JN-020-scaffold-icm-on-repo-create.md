# JN-020 · createClientRepo scaffolds the ICM baseline

| | |
|---|---|
| Status | in-progress |
| Type | feature |
| Priority | P1 |
| Size | S |

## Problem

`createClientRepo` (websites/admin-dashboard/app/(app)/actions.ts + lib/github.ts
`createRepo`) creates a bare `auto_init` repo — no `.icm/`. A freshly converted client
is invisible to the tickets board and the form picker until someone hand-creates files,
and `icm-check` later finds the repo as a gap. The scaffold already exists
(`_system/template/icm/`, now in `icm-board`) and so does the write path —
`commitRepoFile` in lib/github.ts, proven by `writeFormAnswersToRepo` with the same
token scope.

> **Blocker settled 2026-08-27 — option (a).** `_system/template/icm/` lives in
> `k0d0minio/icm-board`, so it is read over the contents API at call time with the same
> `GITHUB_TOKEN` pattern `lib/tickets.ts` and `lib/onboarding.ts` already use for repos
> that were never on this deployment's disk. One source of truth: a template edit
> reaches the next repo created with no redeploy here. Vendoring a copy (b) was rejected
> for the drift it invites; deferring to `icm-check.sh --fix` (c) leaves the window
> where a new repo is absent from the board, which is the whole complaint.
>
> Consequence: the `outputFileTracingIncludes` step in the build notes below is moot —
> there is nothing on disk to trace, so next.config.ts is untouched.

## Build

After repo creation, commit the template scaffold into the new repo: every file under
`_system/template/icm/` walked recursively (so a template addition needs no code change
here) becomes `<repo>/.icm/<path>`, with `{{PREFIX}}` substituted. The prefix is derived
from the repo name exactly as `derive_prefix` in `icm-check.sh` does — first
hyphen-segment, uppercased, A–Z only, ≤5 chars — and the seeded `intake/README.md`
carries the same *"suggested — confirm before the first ticket"* caveat the script
prints, since there is no stdout to print it to. Registering the prefix in
`_system/contracts/TICKETS.md` stays a human step.

Scope is `.icm/` only. `_system/template/claude/` is deliberately left to
`icm-check.sh --fix`: its hooks are executable, and the contents API can't set a file
mode, so seeding them from here would land them inert.

## Acceptance

- [ ] A newly created client repo appears on the tickets board (empty, not absent) and
      in the form picker from minute one
- [ ] `icm-check.sh` finds no `.icm/` gaps in a fresh repo (`.claude/` gaps remain, by
      the scope decision above)
- [ ] Scaffold commit failure surfaces as an error without losing the created repo link
- [ ] CI green

## Prompt

Make createClientRepo scaffold the ICM baseline into new client repos. Read
.icm/intake/JN-020-scaffold-icm-on-repo-create.md for full context — the cross-repo
blocker is settled as option (a). Read `_system/template/icm/` out of
`k0d0minio/icm-board` over the GitHub contents API and commit it into the new repo with
the existing `commitRepoFile` in websites/admin-dashboard/lib/github.ts
(`{{PREFIX}}` substituted from the repo name), right after repo creation in
app/(app)/actions.ts. Open a PR on a claude/ branch; do not run local checks — CI is the
source of truth.
