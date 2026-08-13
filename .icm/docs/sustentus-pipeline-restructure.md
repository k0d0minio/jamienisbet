# Sustentus pipeline restructure — execution report (JN-014)

**Date:** 2026-08-13 · **Prepared by:** analysis session with Jamie (all decisions below are
Jamie's, given in answer to direct questions — treat them as settled, not proposals).
**Executor:** an Opus agent running **on this machine** (the sustentus repo lives at
`~/Apps/projects/sustentus`, which is gitignored in the Apps repo and invisible to cloud
sessions). **Target repos:** `~/Apps/projects/sustentus` (remote `sustentus/sustentus`) and
`~/Apps` (estate follow-ups).

## Why

The working relationship with Paul and David has changed. Going forward:

1. **Work arrives as a written user story from Paul or David** — that story enters the
   pipeline at Scope. The Google-Doc interrogation/review round-trip is retired.
2. **The demo app (`apps/demo`) is no longer actively developed.** Specs are built directly
   against `apps/web`, where a demo tenant exists (in production **and already in the
   preview environment** — see Facts below).
3. **`pipeline/` is renamed to `.icm/`.** In the PR, present this simply as part of the
   workflow restructure — **do not mention** machine-local or estate conventions as the
   motivation, anywhere in the PR title, description, or commits.

## Decisions (Jamie's answers, verbatim intent)

| Question | Decision |
|---|---|
| Fate of the Design stage (02_design) | **Remove it entirely.** Spine becomes scope → define → build → verify → ship. The `demo: throwaway\|seed\|none` concept dies everywhere. |
| Does the Google Doc round-trip survive? | **No — the story IS the scope.** The story is committed verbatim as a `_source` file; Scope interrogates ambiguities back to the author via Jamie; approve/cut runs against the settled story. No Drive, no fold-from-Doc. |
| David's role in gates | **Paul and David are interchangeable business approvers** on any run, regardless of who wrote the story. Contracts say "Paul or David". |
| Fate of `apps/demo` code | **Freeze in place.** Code stays in the monorepo and keeps deploying; all docs/skills/contracts stop pointing work at it and mark it legacy/frozen. No deletion in this change. |
| Pre-merge review surface | **A demo tenant already exists in the preview environment** — no seeding work needed. (This contradicts a stale comment in `db-migrate.yaml`; see Cleanups.) |
| Business gate before merge | **Jamie's two PR gates only.** Business involvement ends when the story is settled at Scope (running `approve` is the record). Paul/David may be shown the preview URL informally; nothing blocks on them. |
| New `scope.md` shape | **Story + addendum.** The settled story text plus a short structured addendum. The 15-section `scope-template.md` format retires. |
| Stage numbering after removing Design | **Renumber cleanly:** `01_scope`, `02_define`, `03_build`, `04_verify`, `05_ship`. Old runs keep their old folder names; scripts/CI gain legacy fallbacks. |
| Estate tickets board | **Sustentus stays exempt** — fix the stale `sustentus-v2` name in the exempt lists to `sustentus`. Stub format unchanged. |
| Story channel | **Varies** (Slack, email, call notes). The contract just says: the operator supplies the story text; it is committed verbatim as `_source/story.md` before interrogation starts. |
| PR shape (sustentus) | **One combined PR** for rename + restructure. Keep commits clean (mechanical move separate from semantic rewrites). |

## Target state (what the pipeline looks like after)

Five stages, four gates. The `/pipeline` slash command **keeps its name** — only the folder
renames.

| `/pipeline …` | Stage folder | Job | Gate after |
|---|---|---|---|
| `scope "<story>"` | `stages/01_scope/` | commit the story verbatim (`_source/story.md`), interrogate ambiguities via Jamie back to the author | ✅ Paul or David agrees the settled story — running `approve` **is** the record |
| `approve <slug>` | `stages/01_scope/approve/` | settle the Q&A into `scope.md` (story + addendum); cut intake stubs | — flows into Define |
| `new` / `define` | `stages/02_define/` | stub → approvable `spec.md`, opens the one feature PR | ✅ **Spec approved** PR checkbox (Jamie) |
| `build <slug>` | `stages/03_build/` | implement the spec on the run's branch | — flows into Verify |
| `verify <slug>` | `stages/04_verify/` | readiness · code review · security · DoD smoke on the preview | ✅ quality gate confirmed (in-conversation) |
| `ship <slug>` | `stages/05_ship/` | docs + changelog → gated squash-merge → ship note | ✅ **Ready to merge** PR checkbox (Jamie) |

- **Canonical scope moves through two homes, not three:** `_source/story.md` (verbatim,
  never edited) → `scope.md` at approve → `spec.md` at Define.
- **One PR regime.** Scope + approve still commit straight to `main` (no PRs) touching only
  `.icm/runs/<slug>/**` + `.icm/intake/<slug>/**`; Define onward is the one feature PR.
  Design's `apps/demo`-only PR regime is gone.
- **`scope.md` shape** (rewrite `_shared/scope-template.md` in place to specify this):
  the settled story text, then an addendum: `## Assumptions` · `## Questions & answers`
  (every question put to the author and the answer — this replaces the fold log as the
  audit trail) · `## Out of scope`. Keep Scope's standing rules: business/product logic
  only, no file paths or framework names, no reading source code.
- **New `run.md` template fields:** drop `doc:`, `preview-prs:`, `demo:`; add
  `story: 01_scope/_source/story.md` and `author: Paul | David`. Keep `lane:`, `personas:`,
  `scope-agreed:`, `stubs:` (now `.icm/intake/<slug>/`), `branch:`, `pr:`.
- Fast lanes (bug/tweak/chore) and the cut contract (`intake/CONTEXT.md`) survive
  structurally unchanged — the cut just reads the new `scope.md` shape.
- Personas remain real vocabulary (they exist in `apps/web`); `persona:*` labels and the
  Verify persona sign-in smoke stay.

## Part A — sustentus repo, one combined PR

Suggested commit structure (one PR, reviewable commits):

1. **`git mv pipeline .icm`** — nothing else in this commit.
2. **Mechanical path updates** — every `pipeline/` path reference (inventory below).
3. **Stage renumbering** — `git mv` `03_define→02_define`, `04_build→03_build`,
   `05_verify→04_verify`, `06_ship→05_ship`; delete `stages/02_design/`; script/CI fallbacks.
4. **Contract rewrites** — Scope/approve for story intake, CONTEXT.md map, templates,
   github.md, knowledge-map, SKILL.md, router hook.
5. **Freeze annotations + cleanups.**

Open the PR with only the **Ready to merge** anchor (lane-style — no spec behind it), per
`_shared/github.md`. Jamie reviews and merges. CI is the source of truth: push and read
checks; never run build/lint/typecheck/test locally (the repo's hook enforces this).

### A1 · Rename inventory (verified at 2026-08-13; re-grep before editing, lines drift)

Scripts all resolve `repo_root` correctly from their own location; only the literal
`pipeline/` appendages break:

- `pipeline/scripts/project-labels.sh:53` · `resolve-run.sh:50` · `new-run.sh:63,216,275`
  · `validate-intake.sh:53` · `validate-spec.sh:42-43` · `send-investor-update.sh:73-76`
  — plus comment/message strings throughout all six (cosmetic but user-facing; update).
- `.github/workflows/pipeline.yaml` — trigger `paths` (:23-24), greps (:54, :87, :116),
  spec path (:59-60), script invocations (:67, :91, :123, :127), release grep (:156).
- `.github/workflows/ship-note.yaml` — `paths` (:24), grep (:84), script call (:111).
- `.github/workflows/quality.yaml:66` — `- '!pipeline/**'` → `- '!.icm/**'` (this filter
  keeps markdown-only pipeline PRs out of the heavy build — do not lose it).
- `.github/workflows/claude-code-review.yaml` — `paths-ignore` (:17), prompt text (:52).
- `.claude/settings.json:24-27` — `Bash(pipeline/scripts/…)` allowlist entries → `.icm/scripts/…`;
  **also add the missing entries** for `validate-intake.sh` and `send-investor-update.sh`.
- `.claude/hooks/block-local-checks.sh:4,67` — error text references
  `pipeline/stages/04_build/CONTEXT.md` → `.icm/stages/03_build/CONTEXT.md`.
- `.claude/skills/pipeline/SKILL.md` — routing table and `runs/`/`intake/` paths (:26-48,
  :102-113) plus the semantic edits in A3.
- `.prettierignore:23` — `pipeline/runs/**` → `.icm/runs/**` (losing this would let
  Prettier rewrite run artifacts).
- `/CLAUDE.md` — routing links (:75-76) and the Build-stage reference in the checks
  paragraph (:66).
- `.icm/runs/README.md` — archive prose (the `apps/docs/archive/pipeline-runs/` directory
  name itself stays; it's history).
- Open intake stubs (`v1-user-hierarchy`, `vendor-metrics`, `service-fee-deprecation`,
  `preview-db-migrations`, `pipeline-subagents`, `db-audit-findings`) — grep the non-`_done`
  stub bodies for `pipeline/` paths and update **paths only**.
- **Do not rewrite historical artifacts** under `.icm/runs/<slug>/**` or `_done/` stubs —
  they ride along in the `git mv` untouched.
- Clean (verified no `pipeline` string): `package.json`, `turbo.json`, `.husky/*`,
  `.gitignore`, `pnpm-workspace.yaml`.
- GitHub Actions `paths:` filters match dot-directories fine (`.github/**` is the standard
  example); `.icm/**` needs no special casing.

### A2 · Remove the Design stage and all demo-app plumbing

- Delete `stages/02_design/` (contract only — `apps/demo` code stays, see A5).
- `.icm/CONTEXT.md` (the L1 map) — rewrite: spine table (five stages, four gates as
  above), the "Two PR regimes" section → one regime, layout tree, `run.md` template,
  "State lives in two homes" table (two scope homes, not three), "Where each thing is
  defined" rows (drop the scope-Doc and Design rows).
- `_shared/github.md` — front-regime guard becomes: front pushes touch only
  `.icm/runs/<scope-slug>/**` + `.icm/intake/<scope-slug>/**` (drop the `apps/demo/**`
  allowance); remove the "demo URL at Design" prose (:68). `persona:*` labels stay.
- `_shared/knowledge-map.md` — remove the Design row (:51); Scope's business pages and
  `roles/` persona pages stay.
- `_shared/stage-preamble.md` — check for Design/demo references during run adoption.
- `02_define` (ex-`03_define`) — drop the `design-notes.md` input (:28) and every
  `demo:` field (spec header :58, template :97, :128); Inputs become the stub +
  `scope.md` (story + addendum shape).
- `03_build` (ex-`04_build`) — drop the seed/throwaway porting paragraphs (:13-14) and
  the `demo:` build-notes field (:77).
- `04_verify` (ex-`05_verify`) — remove the stale `pipeline/_design/testing-strategy-brief.md`
  reference (:65 — the file does not exist); the persona sign-in DoD smoke stays (it
  targets `apps/web`).
- `.claude/skills/pipeline/SKILL.md` — remove the `design` subcommand, its status logic
  reading `design-notes.md` (:107), and the help line (:122); renumber stage references.
- `.claude/hooks/route-request.sh:86` — the NEW FEATURE advisory currently says
  "(Doc + gate with Paul), then approve → design → define…" → rewrite for the story flow:
  scope (story + gate with Paul or David) → approve → define → build → verify → ship.

### A3 · Story-based Scope (the biggest rewrite)

- `stages/01_scope/CONTEXT.md` — new job: take the story text the operator supplies
  (channel varies — Slack, email, call notes; the contract doesn't fix it), pick the slug,
  commit the story **verbatim** to `runs/<slug>/01_scope/_source/story.md`, then
  interrogate ambiguities — questions go to the author (Paul or David) **via Jamie**, who
  is still never assumed to be in the session with them. Keep: business-logic-only rule,
  no-source-code rule, Definition of Ready / scope-freeze concept, slug-names-everything.
  Drop: everything about Drive, the Doc, the fixed Drive folder ID, the 15-section
  template, the 2,000-word ceiling.
- `stages/01_scope/approve/CONTEXT.md` — the fold becomes the settle: fold the Q&A
  answers into `scope.md` (story + addendum, with the `## Questions & answers` log as
  the audit trail), append `scope-agreed:` + `stubs:` to `run.md`, invoke the cut
  (`intake/CONTEXT.md`), push to `main`. Running `approve` remains the record of
  agreement.
- `_shared/scope-template.md` — rewrite content in place (keep the filename; contracts
  link it) to the story + addendum shape.
- `intake/CONTEXT.md` — update its Input description (folded `scope.md` → settled
  story + addendum); stub shape and `breakdown.md` unchanged; the audit-skills side door
  note stays.
- All "Paul"-only approver prose repo-wide (26 files mention him) → "Paul or David"
  where it's about business agreement. Historical run artifacts excluded.

### A4 · Renumbering fallbacks (new runs new numbers; old runs old folders forever)

- `validate-spec.sh` — primary `02_define/output/spec.md`; keep `03_define` and
  `01_define` as legacy fallbacks.
- `send-investor-update.sh` — primary `05_ship/…`; keep `06_ship`, `03_release`,
  `03_ship` legacy fallbacks.
- `pipeline.yaml` — spec grep `(01|03)_define` → `(01|02|03)_define`; release grep
  `06_ship` → `(05|06)_ship`.
- `ship-note.yaml:84` — `06_ship` → `(05|06)_ship`.

### A5 · Freeze `apps/demo`

Code stays, keeps deploying from `main`. Add a one-line frozen banner ("legacy — frozen
2026-08; no new development; specs build against `apps/web` + the demo tenant") to:
`/CLAUDE.md` monorepo table row · `CONVENTIONS.md` `### apps/demo/` section and
`## Demo-specific rules` (keep the rules — they still govern maintenance edits) ·
`.claude/SKILLS.md` `dashboard-page` row · `dashboard-page/SKILL.md` header ·
`factory-checks/SKILL.md` dev-server table row. Keep the ESLint rules and the
`dashboard-page → apps/demo/**` auto-load mapping (they protect the frozen code).
`apps/web/AGENTS.md`'s "mock data is an `apps/demo` concept" line stays true.

### A6 · Cleanups riding along

- `db-migrate.yaml:200-206` — the comment "the shared preview DB has no demo tenant to
  flag" is **stale per Jamie**: a demo tenant already exists in the preview environment.
  Update the comment. **Verify with Jamie before changing any env wiring** (whether
  `DEMO_TENANT_CLERK_ORG_ID` should now be present for `migrate-preview` is his call —
  comment fix only unless he says otherwise). Never add secret values.
- `quality.yaml:106` — references the nonexistent `pipeline/_design/testing-strategy-brief.md`;
  remove or repoint.
- **Local only, not in the PR:** `.claude/settings.local.json` is untracked and stale —
  absolute paths to `/home/jamie-nisbet/Apps/sustentus-v2/…` and three deleted scripts.
  Fix the paths on disk (`~/Apps/projects/sustentus/.icm/scripts/…`), drop dead entries.

### Verify (within the no-local-checks rule)

The factory scripts are not build/lint/test — you may run them: after renaming, smoke
`.icm/scripts/resolve-run.sh` against an old slug (legacy folder fallback),
`validate-spec.sh` against an old run (e.g. `vendor-metrics`), `validate-intake.sh`
against an open intake folder. Then push and read CI — `pipeline.yaml`'s intake/spec
checks re-run on the PR and are the real verdict.

## Part B — Apps estate repo (separate, small PR in `~/Apps`)

- `_system/tickets-board.sh:26`, `_system/ticket-hygiene.sh:21`, `_system/icm-check.sh:40`
  — `EXEMPT=("sustentus-v2")` → `EXEMPT=("sustentus")`; update the matching comment lines
  (:5/:4/:5). Then grep the whole repo for remaining `sustentus-v2` mentions.
- `/CLAUDE.md` standing rule — "**Sustentus-v2 is exempt** from the estate baseline — its
  `pipeline/` is authoritative" → "**Sustentus is exempt** from the estate baseline — its
  `.icm/` is authoritative (own pipeline semantics, not TICKETS-SPEC)".
- `websites/admin-dashboard` Tickets screen — find how it discovers repos' `.icm/intake/`
  and confirm sustentus stays excluded after it gains a `.icm/` (search for an exempt
  list or scan logic; mirror the `_system` exemption if needed).
- This PR must also not mention the machine-convention motivation.

## Standing guardrails for the executor

- Gates are human checkboxes — read them, never tick them; Jamie merges.
- CI is the source of truth; no local build/lint/typecheck/test/format, ever.
- Don't rewrite history: `.icm/runs/**` artifacts and `_done/` stubs move but are not edited.
- The `/pipeline` command name, lane contracts, cut/stub/breakdown formats, and
  `persona:*` labels all survive unchanged.
- Flag any plaintext credential found; never commit one.
