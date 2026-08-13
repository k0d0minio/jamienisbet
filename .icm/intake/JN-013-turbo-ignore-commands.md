# JN-013 · Adopt turbo so deploy skip rules derive from the dependency graph

| | |
|---|---|
| Status | ready |
| Type | chore |
| Priority | P2 |
| Size | M |

## Problem

JN-004 stopped the four-deploys-per-commit problem, but with a hand-maintained rule.
Each app's `vercel.json` carries an `ignoreCommand` that spells out its inputs as a
literal path list:

```
git diff --quiet ${VERCEL_GIT_PREVIOUS_SHA:-HEAD^} HEAD -- ':(top)websites/portfolio' \
  ':(top)packages/ui' ':(top)packages/app-shell' ':(top)packages/services' \
  ':(top)package.json' ':(top)pnpm-lock.yaml' ':(top)pnpm-workspace.yaml'
```

The resolution note on JN-004 is explicit about why ("the repo has no turbo"), and
`websites/README.md` § Deployment records the maintenance cost: *"adding a workspace
dependency to an app means adding its path to that app's `ignoreCommand`."* That is a
silent-failure edge — nothing enforces it, and forgetting it means the app stops
deploying on changes to a package it now depends on. The lists have already drifted
once: `websites/payment-gateway` does not list `packages/services`, correctly today (it
doesn't depend on it) but only by coincidence of nobody having added that dependency.

Turbo derives the same answer from `package.json` dependencies, so the rule maintains
itself. Four apps × three shared packages is small enough that the payoff is
correctness, not speed — do not adopt turbo as a build orchestrator or caching layer as
part of this ticket.

## Acceptance

- [ ] `turbo` added as a root devDependency; root `turbo.json` defines a `build` task
      with `dependsOn: ["^build"]` and the env vars each app build reads
- [ ] Each app's `vercel.json` `ignoreCommand` replaced with
      `npx turbo-ignore <workspace name>` (e.g. `@jamie-nisbet/portfolio`), so the path
      list is gone from all four files
- [ ] The admin dashboard's extra non-package input (`.icm/onboarding/`) still forces a
      build — turbo's graph cannot see it, so chain it:
      `npx turbo-ignore @jamie-nisbet/admin && git diff --quiet ${VERCEL_GIT_PREVIOUS_SHA:-HEAD^} HEAD -- ':(top).icm/onboarding'`
      (`ignoreCommand` exit 0 = skip, so both must agree to skip)
- [ ] Fail-open preserved: a missing/unreachable comparison commit (first deploy,
      shallow clone) builds rather than skips. Verify `turbo-ignore`'s fallback
      behaviour and set `--fallback` explicitly if the default is to skip
- [ ] Comparison stays against the last *deployed* commit, not bare `HEAD^` — the bug
      JN-004 fixed on its second pass (a multi-commit push skipped four real deploys)
      must not regress
- [ ] `websites/README.md` § Deployment rewritten: the "add the path yourself" warning
      replaced by how turbo-ignore infers inputs, plus the dashboard's chained exception
- [ ] Existing CI (`.github/workflows/ci.yml`) still green and left on its own
      `pnpm -r` / per-app matrix — this ticket does not move CI onto turbo
- [ ] Post-merge, verify on real pushes: a ticket-only commit to `.icm/intake/` skips all
      four builds; a `packages/ui` commit builds all four; a `websites/portfolio`-only
      commit builds exactly one

## Notes

- `turbo-ignore` runs `turbo build --filter=<pkg>...[<sha>]` under the hood, so the
  `build` task must exist in `turbo.json` or every invocation errors (and, fail-open,
  builds everything — the failure mode is silent 4x deploys returning).
- Turbo's `globalDependencies` is the wrong tool for `.icm/onboarding/`: it applies to
  every package and would rebuild all four. Task `inputs` are package-relative and can't
  reach outside the app folder. Hence the chained `git diff`.
- Vercel's build image already has `npx`; no install step is needed for the ignore
  command itself.

## Prompt

Adopt turbo in the jamienisbet monorepo for the sole purpose of deriving Vercel's
skip-build rules from the workspace dependency graph. Read
.icm/intake/JN-013-turbo-ignore-commands.md for full context, and
websites/README.md § Deployment plus .icm/intake/_done/JN-004-commit-vercel-config.md
for the history of the current hand-maintained rule.

Add turbo as a root devDependency and a root turbo.json with a `build` task
(`dependsOn: ["^build"]` and the env vars the Next.js app builds read), then replace the
literal path list in each of the four websites/*/vercel.json `ignoreCommand` values with
`npx turbo-ignore <workspace name>`. The admin dashboard additionally depends on
`.icm/onboarding/`, which turbo cannot see — chain a `git diff --quiet` for that path
after turbo-ignore with `&&`, since exit 0 means skip. Preserve two properties of the
current rule: it fails open (builds when the comparison commit is missing) and it
compares against the last deployed commit rather than bare HEAD^. Update
websites/README.md § Deployment to describe the new mechanism and drop the "add the path
yourself when you add a dependency" warning. Leave .github/workflows/ci.yml on its
existing pnpm -r and per-app build matrix — this is not a CI migration.

Open a PR on a claude/ branch; do not run local checks — CI is the source of truth. Call
out in the PR body that the skip behaviour needs confirming on real pushes after merge
(ticket-only commit → zero builds, packages/ui commit → four, single-app commit → one).
