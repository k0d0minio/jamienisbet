# JN-020 · createClientRepo scaffolds the ICM baseline

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | S |

## Problem

`createClientRepo` (projects/jamienisbet/websites/admin-dashboard/app/(app)/actions.ts + lib/github.ts
`createRepo`) creates a bare `auto_init` repo — no `.icm/`. A freshly converted client
is invisible to the tickets board and the form picker until someone hand-creates files,
and `icm-check` later finds the repo as a gap. The scaffold already exists
(`_system/template/icm/`) and so does the write path — `commitRepoFile` in
lib/github.ts, proven by `writeFormAnswersToRepo` with the same token scope.

## Build

After repo creation, commit the template scaffold into the new repo:
`.icm/intake/README.md` with `{{PREFIX}}` substituted (derive from the repo name, same
"suggested — confirm before first ticket" wording the icm-check convention uses) and
`.icm/intake/_done/.gitkeep`. Runtime access to `_system/template/` needs
`outputFileTracingIncludes` in the dashboard's next.config.ts — the same mechanism
lib/onboarding.ts already uses for `.icm/onboarding/`. Registering the prefix in
`_system/contracts/TICKETS.md` stays a human step.

## Acceptance

- [ ] A newly created client repo appears on the tickets board (empty, not absent) and
      in the form picker from minute one
- [ ] `icm-check.sh` finds no gaps in a fresh repo
- [ ] Scaffold commit failure surfaces as an error without losing the created repo link
- [ ] CI green

## Prompt

Make createClientRepo scaffold the ICM baseline into new client repos. Read
.icm/intake/JN-020-scaffold-icm-on-repo-create.md for full context. Use the existing
commitRepoFile in projects/jamienisbet/websites/admin-dashboard/lib/github.ts to commit
_system/template/icm/ contents ({{PREFIX}} substituted from the repo name) right after
repo creation in app/(app)/actions.ts; trace _system/template/ into the bundle via
outputFileTracingIncludes in next.config.ts as lib/onboarding.ts does for
.icm/onboarding/. Open a PR on a claude/ branch; do not run local checks — CI is the
source of truth.
