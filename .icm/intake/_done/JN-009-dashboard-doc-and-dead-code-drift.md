# JN-009 · Clean dashboard doc drift and dead pipeline-era code

| | |
|---|---|
| Status | ready |
| Type | chore |
| Priority | P2 |
| Size | S |

## Problem

Leftovers from the retired ICM-factory era contradict reality:

- `lib/github.ts` carries `seedRepoFiles()` and `getRepoSnapshot()` with zero callers
  (both belonged to the retired pipeline / delivery-doc seeding).
- Screen-count contradiction: `websites/admin-dashboard/README.md` says both "four
  screens" and twice "three" (omitting Tickets); `.icm/docs/decisions.md` repeats the
  "three" version and still describes delivery-doc seeding as live.
- `.icm/docs/decisions.md` links to retired `_config/` files that no longer exist, and
  references a `scripts/` folder that isn't in the tree
  (`.claude/settings.local.json` still allowlists `./scripts/new-project.sh`).
- `websites/admin-dashboard/tsconfig.tsbuildinfo` is committed (build artifact).

## Acceptance

- [ ] Dead functions removed (or a one-line seam note if deliberately kept)
- [ ] READMEs and decisions.md agree with the four real screens and the retired seeding
- [ ] Dead links/references removed; tsbuildinfo untracked + ignored
- [ ] CI green

## Resolution (2026-08-12)

Dead functions removed; screen counts and decisions.md reconciled (dead links out, seeding and
`rates.md` recorded as retired, the 2026-08 factory retirement now actually in the register).
Two acceptance items turned out already true: `tsconfig.tsbuildinfo` was already untracked and
gitignored, and `.claude/settings.local.json` is a local-only untracked file (its stale
allowlist can only be cleaned on the machine).

## Prompt

Clean the documented-vs-real drift in the jamienisbet repo: remove the uncalled
seedRepoFiles/getRepoSnapshot from websites/admin-dashboard/lib/github.ts, reconcile
the three-vs-four screen counts across websites/admin-dashboard/README.md,
websites/README.md and .icm/docs/decisions.md, fix decisions.md's dead links, and
untrack websites/admin-dashboard/tsconfig.tsbuildinfo (add to .gitignore). Read
.icm/intake/JN-009-dashboard-doc-and-dead-code-drift.md for full context. Open a PR on
a claude/ branch; do not run local checks — CI is the source of truth.
