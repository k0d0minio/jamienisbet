# Project rules — what is true of THIS repo (Layer 3 reference, project-owned)

The stage and lane contracts under `stages/` and `lanes/`, the shared doctrine in `_shared/`, the
capability skills under `skills/` and the factory scripts are **template-owned**: byte-identical in
every pipeline repo, listed in `.icm/MANIFEST`, synced from
`icm-board/_system/template/icm-pipeline/` by `icm-sync.sh` (`.icm/template-version` says which
template this copy was last brought up to), and carrying no repo's identity. Everything specific
to jamienisbet lives in the project-owned files the sync never touches — `.icm/project.json` for
the values a script reads, `_shared/knowledge-map.md` for the pages, `scripts/{format,lint,
validate-knowledge-map,report}.sh`, `runs/README.md`, and **this file** for the rules a stage
reads. A contract that says "see `_shared/project-rules.md`" means: the answer is here.

## People and gates

- **The operator** — Jamie: ticks **Spec approved** and **Ready to merge**, smoke-tests the
  preview by hand, and merges every PR from GitHub.
- **Authors** — the operator himself. This is his own web estate; there is no client.
- **The client contact** — none. Nothing here reports to a client; `REPORT_EMAIL_TO` is unset.
- **UAT sign-off** — none: `uat` in `.icm/project.json` is undeclared, so every run ships to
  production on the merge.
- **The GitHub repo** is `k0d0minio/jamienisbet`, **private**, on a plan without rulesets or
  branch protection (the API answers 403) — `main` is protected by convention only: ticket-only
  commits go straight to `main`, everything else through a PR on a `claude/` branch (`AGENTS.md`).

## Knowledge

- **Docs tree** — none: `docs_path` is empty. Knowledge lives in `AGENTS.md`, `README.md` and
  each folder's `README.md` (`websites/*/README.md`, `packages/*/README.md`), which
  `_shared/knowledge-map.md` names. The knowledge lane edits those READMEs.
- **Code rules** — `AGENTS.md` § Standing rules plus `packages/ui/BRAND.md` for anything visual
  (the `design-dna` skill auto-loads its checklist). `_shared/conventions.md` redirects there.
- **Personas** — `visitor` (the portfolio's public reader), `operator` (Jamie in the admin
  dashboard), `affiliate` (the sellers-site referrer) — the `personas` array in
  `.icm/project.json`. A spec's `- personas:` line names at least one.

## The factory

- **Required CI checks** — `Typecheck + lint`, `Build portfolio`, `Build sellers-site`,
  `Build admin-dashboard` (workflow `CI`, `.github/workflows/ci.yml`), on every PR and on `main`,
  no tiering: a draft head and a ready head run the same jobs. `DB migrations`
  (`db-migrations.yml`) adds `Validate migrations (no DB writes)` on PRs touching
  `packages/services/**` — path-filtered, so not listed as required.
- **Deploy** — `deploy` in `.icm/project.json`: Vercel team **`kodominio`**, token named
  `VERCEL_TOKEN_KODOMINIO` (the operator's shell). `portfolio` and `jamie-nisbet` (the admin
  dashboard) are `product` — previews on every push. `client-referrals` (the sellers-site) is
  `quiet`: its `vercel.json` disables every branch but `main`. Unaffected projects are skipped by
  Vercel's built-in monorepo skipping (no `ignoreCommand` — `websites/README.md` § Deployment), so
  an absent Vercel status on a PR is normal, not a failure.
- **Migrations** — Drizzle, in `packages/services/drizzle` (`NNNN_name.sql` + `meta/` journal),
  forward-only (no down scripts — a code revert must tolerate the newer schema). Generate with
  `pnpm --filter @jamie-nisbet/services db:generate`; never hand-write. Drizzle numbers its own
  files, so `check-migrations.sh` sees no stamped file and reports SKIP by design — never use its
  `--new`. `db-migrations.yml` applies them to production on push to `main`.
- **Environment surfaces** — `websites/<app>/.env.example` is the manifest (`env.sh audit`);
  values live in each Vercel project. `DATABASE_URL` is also an Actions secret (the migrate job).
- **Local feedback scripts** — `scripts/lint.sh` runs each website's own ESLint over the changed
  files it owns (errors fail, as CI does). `scripts/format.sh` is not wired — the repo has no
  formatter — and reports SKIP. CI stays the verdict.
- **The security gate** — `scripts/security-check.sh` runs before every commit in Build and
  before every lane's push; not wired as a git hook (no Husky here) — the stages call it.
  gitleaks is not installed on the operator's machine; the built-in patterns are the floor.
  `security.audit_command` is empty (pnpm — the default audit applies).
- **The run's database** — `database.isolation: none`: one shared Neon database (all tables in
  the `biz` schema), migrated only by CI on `main`. A run never migrates a database itself.
- **The environments' databases** — none declared: previews read the same database the Vercel
  project is configured with; no per-preview Neon branches.
- **Health endpoint** — per project under `deploy.projects[]`: `https://www.jamienisbet.com/en`,
  `https://app.jamienisbet.com/login`, `https://sell.jamienisbet.com/en` (each answers 200;
  the bare hosts redirect). `health-check.sh` reads them once after the merge.
- **Archive** — the default `_done/` folders.

## Reporting

- **Kinds → channels** — `announce` → `github-release` (the seeded default); `alert` → none — a
  red CI job and Vercel's deployment-failed email are the alert; `economics` → none.
- **Who calls the hook** — `announce_from: session` — Release calls `report.sh announce`.
- **Changelog** — none; the PR's Summary line is the Release's body.
- **Workflows** — no `release.yaml` (announce_from: session) and no `labels.yaml`, deliberately:
  the run labels are projected by `project-labels.sh` from a session. The vocabulary
  (`type:*`, `stage:*`, `persona:*`, `complexity:*`) must exist in GitHub before `new-run.sh`
  can label a PR — there is no `.github/labels.yml` here yet.

## Support

- **Tier** — `none`. The operator's own estate; no on-call beyond the operator.

## Capability skills the stages may call

- **Pipeline capability skills** — `.icm/skills/<name>/SKILL.md`: `security-audit`,
  `database-migration`, `preview-deploy` (template-owned). This repo's own additions: none.
- **Repo skills** — `.claude/skills/design-dna/` (the UI checklist — Build loads it for any
  visual change). No docs or smoke-test skill; the contracts say what to do when one is absent.

## Learned rules

*The constraints earlier runs paid for, appended before each close-out by two writers with one
shape: `.icm/scripts/retrospective.sh --apply` (at Release and at the end of every lane — one
line per error class a run fixed and flagged with `- rule:` in its `error.log`, or fixed again
after an earlier run already had, counted across the archive's `error.log`s) and
`.icm/scripts/run-pack.sh --sync-rules` (called by `close-out.sh` — the `## Learned rules` a run
wrote in its `FAILURE.md`: what no tool logged — a wrong assumption, a STOP, a skipped step).
Each line carries the run it was learned in. Build and the lanes read this section before their
first edit, with the same standing as the code rules. Edit or delete lines freely — this file is
the repo's own, never synced — and delete a line that reads as a slip rather than a constraint.*

<!-- Retrospective Learned Rule [2026-09-23] -->
- `security-check.sh --branch`'s dependency-audit runs unconditionally (unlike `--staged`, which
  only audits when the change touches a manifest/lockfile) — a lane that touches neither still
  hits `BLOCKED` on whatever pre-existing high/critical advisories the workspace already carries.
  Check `.icm/intake/triage/dependency-advisories-high-critical.md` (or run `pnpm audit
  --audit-level=high` against `origin/main`) before assuming a `--branch` finding is this run's;
  if it predates the branch, park/point at that stub per `security-audit/SKILL.md` → Dependency
  findings rather than widening the PR into a dependency bump. (`security-check/dependency-audit`,
  first seen: strip-unused-env-vars)

<!-- Retrospective Learned Rule [2026-09-23] -->
- nothing under `<svg>` in `@jamie-nisbet/ui`'s brand components (or anything rendered through `next/og`'s `ImageResponse`) may be a custom React component — Satori requires intrinsic elements only inside `<svg>`. Share sub-markup as a plain function returning an element array/fragment, called directly, never as a JSX component tag. (`build error (vercel build log, dpl_ndxtrhhnsspemeqnhycsagicnrf, bld_fnnd`, seen 1× — bump-next-audited-deps; .claude/skills, .github, packages/app-shell, packages/ui)
<!-- Retrospective Learned Rule [2026-09-23] -->
- When a criterion needs an operator's hand test, ask for the result in the criterion's exact shape (e.g. one line per surface × parameter), not a free-form reply. (`FAILURE.md` — model-effort-preselect)
<!-- Retrospective Learned Rule [2026-09-23] -->
- A launch target (or any custom URL scheme) is added `parked` until the operator has tapped its link from the board itself — browser tab and installed PWA — and reported that it opened; a documented link shape is not proof it works. (`FAILURE.md` — launcher-dropdown)
<!-- Retrospective Learned Rule [2026-09-24] -->
- A time-revalidated fetch in the admin dashboard is stale-while-revalidate: the first read past its window returns the old value, so any "refresh" or freshness claim must bust a tag (`updateTag`) rather than rely on the clock having lapsed. (`FAILURE.md` — board-client-state)
<!-- Retrospective Learned Rule [2026-09-24] -->
- In the admin dashboard, never pass `window.history.state` (or any object carrying Next's (`FAILURE.md` — master-detail-shell)
<!-- Retrospective Learned Rule [2026-09-24] -->
- When one element renders two layouts by breakpoint (a pane from `lg`, a pushed view below), (`FAILURE.md` — master-detail-shell)
<!-- Retrospective Learned Rule [2026-09-24] -->
- Name the base as `origin/main` in every review or diff range (`/code-review … origin/main...HEAD`, `git diff origin/main...HEAD`): a cloud session's local `main` is never updated by `git fetch origin main`, so `main...HEAD` silently widens the review to commits already merged. (`FAILURE.md` — repo-and-estate-views)
