# JN-014 · Stop four preview builds on every new branch's first push

| | |
|---|---|
| Status | ready |
| Type | chore |
| Priority | P2 |
| Size | S |

## Problem

JN-013 moved the four `vercel.json` skip rules onto `npx turbo-ignore <workspace>`. On
`main` that works — verified on real pushes: the `.icm/intake/`-only commit `7bd7f06`
and the `.vscode/`-only commit `9609a75` both skipped all four production builds.

Previews regressed. `turbo-ignore` compares against `VERCEL_GIT_PREVIOUS_SHA`, which
Vercel only sets once a branch has a previous deployment. On the **first push of a new
branch** there is none, and with no `--fallback` `turbo-ignore` fails open and builds.
So every new branch costs four full builds regardless of what it touched — confirmed on
`chore/vscode-scan-depth`, where a one-line `.vscode/settings.json` change built all four:

```
No previous deployments found for "@jamie-nisbet/payment-gateway" on branch "chore/vscode-scan-depth"
✓ Proceeding with deployment
```

JN-013's resolution note rejected `--fallback` on the grounds that it "would have
reintroduced the multi-commit-push bug". That reasoning is wrong — reading
`turbo-ignore@2.10.9`'s `getComparison`, `VERCEL_GIT_PREVIOUS_SHA` is checked first and
a fallback is consulted *only* when it is absent or unreachable. The fallback can never
displace the last-deployed-commit comparison JN-004 fixed.

But the instinct behind it was right, for a different reason. `--fallback=HEAD^` would
restore the actual JN-004 bug (a multi-commit first push whose last commit is incidental
skips real changes), and `--fallback=origin/main` applied on **production** would be
worse still: there the deployed commit *is* `main`, so the comparison is empty and all
four apps skip — a first-ever production deploy would never build.

## Acceptance

- [ ] ~~New branches no longer build all four apps on their first push when the branch
      touches nothing an app depends on~~ — **dropped, not achievable.** See Notes: the
      build clone contains no ref that names the default branch
- [x] The fallback applies on branches other than `main` only, never on `main` itself
- [x] `VERCEL_GIT_PREVIOUS_SHA` still wins whenever Vercel sets it and it is reachable —
      the JN-004 last-deployed-commit property does not regress
- [x] Fail-open preserved on every path: unresolvable base, absent `main`, turbo
      erroring, bad `turbo.json` all build rather than skip
- [x] The dashboard's `.icm/onboarding/` check still forces a build on its own
- [x] `.github/workflows/ci.yml` untouched — still `pnpm -r` and the per-app matrix
- [x] The build log states which comparison the ignore step used

## Notes

The rule outgrew a JSON string, so it now lives in `scripts/vercel-ignore.sh` and each
`vercel.json` calls it with its workspace name. The dashboard passes `.icm/onboarding`
as a trailing argument instead of chaining a second `git diff` inline.

Behaviour of `turbo-ignore@2.10.9`, read off `dist/cli.js` rather than the docs (which
do not cover `--fallback`):

- comparison order is `VERCEL_GIT_PREVIOUS_SHA` (if `git cat-file -t` resolves it) →
  `--fallback` → nothing, and "nothing" exits 1, i.e. builds
- an unresolvable fallback ref is *not* pre-checked; it is passed to
  `turbo run build --filter=pkg...[ref]`, turbo errors, and `turbo-ignore` builds

So the failure mode of a fallback that does not resolve is the current behaviour, not a
worse one.

The first attempt fetched `main` before passing `--fallback=origin/main`. That does not
work, and the build log says why:

```
fatal: 'origin' does not appear to be a git repository
```

**Vercel's build clone has no `origin` remote.** So the script instead probed for a ref
already present — `origin/main`, `refs/remotes/origin/main`, `main`, `refs/heads/main`.
The next push answered that too:

```
vercel-ignore: main is not in this clone — building if there is no previous deploy
```

None of them resolve. The clone carries the deployed commit and some ancestors (turbo
diffed against a commit two back quite happily) but **no branch refs and no remote**, so
there is no way to name the default branch from inside the Ignored Build Step. Vercel
exposes no base-branch SHA either — the git system variables are `VERCEL_GIT_COMMIT_SHA`,
`VERCEL_GIT_PREVIOUS_SHA`, `VERCEL_GIT_COMMIT_REF`, `VERCEL_GIT_PULL_REQUEST_ID` and the
repo identifiers, none of which is the merge base.

`--fallback=HEAD^` is the only ref that always resolves, and it is precisely the option
this ticket rules out: on a multi-commit first push it inspects only the last commit and
skips real changes, which is the JN-004 bug.

**So the preview cost is not removable from inside the ignore command.** The first push
of a new branch builds all four apps; every push after it compares against the previous
deployment and skips correctly.

`turbo-ignore` also now prints a deprecation notice on every run, pointing at Vercel's
built-in monorepo skipping. That is **not** a viable move for this repo: built-in
skipping treats any change outside the workspace definition as a global change and
deploys every app, and this repo's most common commit type — tickets in `.icm/intake/`,
`_system/`, `.claude/` — is entirely outside it. It would take ticket-only commits from
zero builds back to four. If the deprecation ever becomes removal, the replacement is
`turbo query affected --base=$VERCEL_GIT_PREVIOUS_SHA --packages <name> --exit-code`,
which Vercel documents for exactly this case.

Verification after merge, on real pushes:

- new branch, first push, touching only `.icm/intake/` → zero preview builds
- new branch, first push, touching `websites/portfolio` only → one preview build
- `packages/ui` commit → four builds
- ticket-only commit on `main` → zero production builds (already true, must stay true)

## Prompt

Stop new branches building all four apps on their first push. Read
.icm/intake/JN-014-preview-deploy-fallback.md for full context, and websites/README.md
§ Deployment for the mechanism JN-013 put in place.

Open a PR on a claude/ branch; do not run local checks — CI is the source of truth.
