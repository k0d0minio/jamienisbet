# `_system` — estate audit, distilled

Rolling record of the `Apps/` estate + `~/.claude` global layer.

> **Consolidated 2026-08-12:** this control layer now lives at the root of the
> `k0d0minio/jamienisbet` monorepo (the Apps root); client repos moved to
> `projects/<repo>`, gitignored. The former `k0d0minio/apps-estate` repo is archived.
> References below to "k0d0minio/<repo>" paths mean `projects/<repo>` on disk.

- **Process:** [PROCESS.md](PROCESS.md) (lead → delivery: onboarding, planning, shipping — driven by `/plan`, `/onboard`, `/wrap`, `/groom`)
- **Tickets:** [TICKETS-SPEC.md](TICKETS-SPEC.md) (estate-wide `.icm/intake/` ticket standard) · [WORK-TRACKING.md](WORK-TRACKING.md) (2026-08-11 analysis behind it) · [tickets-board.sh](tickets-board.sh) / [ticket-hygiene.sh](ticket-hygiene.sh) (read-only board + drift report)
- **Conformance:** [icm-check.sh](icm-check.sh) checks every repo (sustentus-v2 exempt) against the `.icm`/`.claude` baseline; `--fix` populates gaps from [icm-template/](icm-template/) (never overwrites). Driven by the `/icm-check` command in `Apps/.claude/commands/`, which adds a per-repo `.claude` review on top.
- **Status:** global layer cleaned (2026-08-10). Repo-level changes deferred pending the open decisions below.

---

## The estate in one table

| Generation | Pattern | Repos |
|---|---|---|
| Gen 3 — ICM engineering pipeline | thin routing `CLAUDE.md` + `/pipeline` skill + 6-stage `pipeline/` with contracts, gates, runs | **sustentus-v2** (reference impl, 11 runs) · **remi-ai** (specified, 0 runs) |
| Gen 2 — ICM business workspaces | 5-layer folder-is-the-architecture, no orchestration code | jamienisbet, barzinho, agorasim, curated-property |
| Gen 1 — monolithic | one big always-loaded `CLAUDE.md` + copied skill library | courseday (294 lines), tenderdesk |
| Gen 0 — stubs | `@AGENTS.md` one-liner or nothing | ~15 client sites (fine — build-once-hand-off) |

## House style (converged doctrine — worth templating)

- Thin Layer-0 `CLAUDE.md` that **routes, doesn't teach** (~29–88 lines).
- **The folders are the orchestration** — never build an orchestrator.
- Stage contracts share **Inputs / Process / Outputs / Verify** + a 2–8k token budget.
- **CI is the source of truth**; the agent never runs local checks.
- **Gates are human checkboxes** — the agent reads, never ticks.
- **Adopt or STOP**: resolve an existing run, never fabricate one.
- Scripts print a single `RESULT:` line; take config from env, never `.env`.
- **Redirect files, not copies**, for cross-layer references.
- `settings.local.json` is the accretion layer; `settings.json` stays clean policy.

## Still open — security

- **P0** Sanity token still plaintext in `~/.claude.json.bak-20260715`; needs server-side revocation **and** the backup deleted.
- **P0** barzinho P&L PDFs are git-tracked — `.gitignore` pattern no longer matches after the move to `shared/profit-and-loss/`. Needs untrack + pattern fix + history scrub if the repo has a remote.
- **P2** Over-broad grants: remi-ai `Bash(cat > *)` and home-wide `Read()`; `git push`/`gh pr merge` on allow.
- **P3** Orphaned vercel-plugin OAuth material in `~/.claude/.credentials.json`; `garmani/.env` is tracked.
- ✅ Global secrets deny-list now in place machine-wide (`.env*`, `*.pem`, `*.key`, `secrets/**`).

## Still open — broken config (pure fixes, no decision needed)

- sustentus-v2: dead `impeccable` PostToolUse hook errors on **every** Edit/Write; two corrupted markdown tables; dead `architecture-map` + `automation-offload` links; orphaned `packages/ui/SKILL.md`.
- courseday: `CLAUDE.md` calls a `caveman-mode` skill that's named `caveman`; routes to a nonexistent `TICKETS.md`.
- remi-ai: `route-request.sh` present but unregistered while `SKILL.md` still expects it; `project-labels.sh` mislabelled read-only.
- Permission cruft: dead sustentus session grants + nonexistent scripts; tenderdesk's byte-copy of courseday's local settings; stale `~/.claude/projects/` memory dirs for pre-move paths.

## Still open — docs vs reality

The estate's consistent failure mode: **aspirational docs are richer than the running system.**

- sustentus `SKILLS.md` claims no test infrastructure — tests exist in `turbo.json` + CI.
- sustentus README (untouched since Jun 12) lists a nonexistent app, dead scripts, a pipeline shape that never existed.
- jamienisbet README/BACKLOG stale in both directions; `.env.example` has **zero overlap** with the real `.env.local`; the ICM factory has never processed a real client.
- barzinho: the deployed `site/` app and the newest analysis file are invisible to the declared routing; deal terms duplicated in 4 files.
- learn-with-jake-van-clief: `CLAUDE.md`/`CONTEXT.md` are unfilled templates.

## Decisions needed from Jamie

1. **Skills layering** — repo forks vs global copies: global-only, repo-only, or documented shadowing rule?
2. **Pipeline upstream** — is Gen-3 a template product? If so, sustentus or remi-ai is canonical, and is remi-ai worth maintaining at zero runs?
3. **Hook strategy** — repo copies exist for web/cloud parity but have drifted 3 ways. Keep, drop, or generate from the global?
4. **Is merging a PR** an outward action Claude may take, or always yours?
5. **`gh` CLI** — banned by sustentus docs, granted in settings. Which is real?
6. **The ≤50-line `CLAUDE.md` rule** — teaching material says it, flagship repos break it. Which moves?
7. **jamienisbet** — run a real client through it, or freeze it with a status banner?
8. **barzinho** — is the deal still live? Gates the history-scrub urgency.
9. **Scheduled routines** — wanted in July, none exist. First candidate: a weekly automated re-run of this audit's checks.
10. **tenderdesk / courseday** — active, migrate, or archive?

## Done (don't re-litigate)

- Old vercel-plugin disabled · global `CLAUDE.md` created · Sanity MCP removed from live config · `caveman-mode` + blocklist test entries cleaned · permissions deduplicated and tightened (2026-07-15).
- Global skills emptied to `~/.claude/skills-archive-2026-08-10/` · hook double-fire fixed (global defers to repo copy) · ICM section added to global `CLAUDE.md` · `settings.json` allow shrunk 53→9 with a deny-list added · `settings.local.json` pruned to zero grants (2026-08-10).
- Client sites are build-once-hand-off — stub configs are fine, by Jamie's July answer.

---

*Decision-support only. Nothing here supersedes a repo's own contracts — the repo owns its pipeline semantics.*
