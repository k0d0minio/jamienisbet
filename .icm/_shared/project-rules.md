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

- **The verdict** — each affected site's Vercel status (`deploy.projects[].status_context`;
  `_shared/ci.md` → the cost floor, D43). `required_checks` in `.icm/project.json` is
  **empty**. Private on GitHub Free: no ruleset exists, so nothing is required by GitHub — the
  stage contracts and `ci-status.sh` are the gate.
- **The advisory quality job** — `Quality (advisory)` in `.github/workflows/ci.yml`:
  `pnpm -r typecheck` · `pnpm -r lint`, one job, on a **ready** head only (`ready_for_review` /
  `synchronize` / `reopened` with a job-level draft guard), path-filtered out of `.icm/**`,
  markdown and `.github/**`, never on `main`, **no build matrix** (until 2026-09-24 it built all
  three sites — 320 four-job runs a month — that Vercel builds anyway). No unit-test tier by
  design (backlog B5). Reported by `ci-status.sh`, never required: a red run is a finding the
  stage fixes on the branch. **A draft head owes CI nothing** — `lint.sh` before every push
  and `security-check.sh` before every commit are the pre-flip check.
- **Every other workflow, and what each costs** — `DB migrations` (`db-migrations.yml`):
  `Validate migrations (no DB writes)` on PRs touching `packages/services/**` (path-filtered, so
  never required), `Apply migrations to production` on push to `main` touching the same — the
  `DATABASE_URL` secret is why it is CI. Nothing else.
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
- In the admin dashboard, never pass `window.history.state` (or any object carrying Next's `__NA`) to `history.pushState`/`replaceState`: the App Router then treats the call as its own and skips syncing `useSearchParams`, so URL-state views stop re-rendering — pass only your own keys (or `null`). (`FAILURE.md` — master-detail-shell)
<!-- Retrospective Learned Rule [2026-09-24] -->
- When one element renders two layouts by breakpoint (a pane from `lg`, a pushed view below), key its content to the selection and make any side effect it applies (a scroll lock, a listener) re-read the breakpoint on change, not once on mount. (`FAILURE.md` — master-detail-shell)
<!-- Retrospective Learned Rule [2026-09-24] -->
- Name the base as `origin/main` in every review or diff range (`/code-review … origin/main...HEAD`, `git diff origin/main...HEAD`): a cloud session's local `main` is never updated by `git fetch origin main`, so `main...HEAD` silently widens the review to commits already merged. (`FAILURE.md` — repo-and-estate-views)
<!-- Retrospective Learned Rule [2026-09-24] -->
- In the admin dashboard's URL-state screens, any client state that overrides what the URL selects must record the selection it was set under and be ignored once the URL has moved on (back/forward, links), so the URL always wins. (`FAILURE.md` — keyboard-nav)
<!-- Retrospective Learned Rule [2026-09-25] -->
- A migration acceptance criterion must match `database.isolation` in `.icm/project.json`: with `none`, the proof is the PR's `Validate migrations (no DB writes)` plus the post-merge `Apply migrations to production` — never a Neon branch or a local `db:migrate`. (`FAILURE.md` — drop-todos-compliance)

<!-- Retrospective Learned Rule [2026-09-25] -->
- In `packages/ui`, a component prop that reuses a native attribute name (`align`, `size`, `title`, `value`, `type`, `label` on some elements) must `Omit` the native one from `React.ComponentProps<…>` first — the intersection otherwise narrows to `never`, and only the consuming app's `next build` type check catches it. (`TS2322`, seen 1× — desk-tier; .claude/skills, packages/ui)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In `packages/ui`, a table with a sticky header uses `border-separate border-spacing-0` and draws its hairlines on the cells: under `border-collapse` the borders belong to the table and scroll away beneath a sticky `<th>`. (`FAILURE.md` — desk-tier)
<!-- Retrospective Learned Rule [2026-09-25] -->
- A `packages/ui` token that aliases a themed token with `var()` is declared on `:root, [data-theme]`, not `:root` alone — it resolves where it is declared, so a nested theme subtree would otherwise keep the root's colours. (`FAILURE.md` — desk-tier)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In the admin dashboard, a jump that only changes Work's board selection while already on `/` writes the URL with `window.history.pushState(null, "", href)`, never `router.push` — a router navigation re-runs the page and puts the skeleton back over the board. (`FAILURE.md` — shell-rail-palette)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In the admin dashboard, fixed chrome sized by a token (the rail, the tab bar) grows by the safe-area inset it clears — width or height plus `env(safe-area-inset-*)` — and the content offset reads the same sum; padding the inset inside the token's size leaves no room for the items. (`FAILURE.md` — shell-rail-palette)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In the admin dashboard, decide any refusal the row's own data already knows before an optimistic removal; only an outcome the server alone can know may roll a row back. (`FAILURE.md` — inbox-rebuild)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In the admin dashboard, state one screen leaves in session storage for another must also record how the second screen was reached, and be honoured only on that path — presence in storage is not proof the user came from there. (`FAILURE.md` — lead-profile-columns)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In this repo, the post-flip push must change a file (an `.icm/` run file is enough): an empty commit is skipped by Vercel as "Not affected" and leaves the full gate with no preview. (`FAILURE.md` — leads-table-board)
<!-- Retrospective Learned Rule [2026-09-25] -->
- Never re-render a whole PR body to tick acceptance criteria — that also rewrites the gate boxes; tick criteria only by editing those lines, or leave the ticks to `notes.md`. (`FAILURE.md` — leads-table-board)
<!-- Retrospective Learned Rule [2026-09-25] -->
- A GitHub check run's newest attempt is its highest id, not its latest start: a queued re-run has no start time yet. (`FAILURE.md` — gates-read)
<!-- Retrospective Learned Rule [2026-09-25] -->
- A GraphQL call reports failure inside an HTTP 200, so any cache rule that keys on the status code must also read the answer's `errors` before trusting it. (`FAILURE.md` — gates-read)
<!-- Retrospective Learned Rule [2026-09-25] -->
- A spec never promises how another, unbuilt stub will use this run's work; name the overlap as out of scope and let whichever run lands second reconcile it. (`FAILURE.md` — work-reader)
<!-- Retrospective Learned Rule [2026-09-25] -->
- For `new <stub-name>`, run the same `depends-on` merged check bare `new` runs before opening a run, and say which dependencies are unmet. (`FAILURE.md` — work-reader)
<!-- Retrospective Learned Rule [2026-09-25] -->
- A spec for an admin screen names motion only after reading `.claude/skills/design-dna/SKILL.md` → Motion: the desk tier is instant or a ≤120ms colour change, never a slide. (`FAILURE.md` — work-phone)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In the admin dashboard, a phone screen scrolls the window, not a container of its own: pull-to-refresh (`components/pull-to-refresh.tsx`) listens to the page scroll. (`FAILURE.md` — work-phone)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In the admin dashboard, an in-app back that uses `history.back()` must first check the entry behind it is not deeper than the current level — a pushed parent over a cold link otherwise loops the two. (`FAILURE.md` — work-phone)
<!-- Retrospective Learned Rule [2026-09-25] -->
- In the admin dashboard, an edge-swipe gesture listens on the view itself (non-passive `touchmove`, decided after a slop), never through a `touch-none` overlay, which eats the taps and scrolls under it. (`FAILURE.md` — work-phone)
