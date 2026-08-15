# Estate audit — rolling record

*Live state of the `Apps/` estate and the `~/.claude` global layer: what is broken, what is
unresolved, what has been settled. Split out of [README.md](README.md) on 2026-08-14 so
doctrine (stable) and audit (decays) stop sharing a file.*

> **Consolidated 2026-08-12:** the control layer lives at the root of the
> `k0d0minio/jamienisbet` monorepo (the Apps root); client repos moved to
> `projects/<repo>`, gitignored. The former `k0d0minio/apps-estate` repo is archived.
> References to "k0d0minio/<repo>" paths mean `projects/<repo>` on disk.

## The estate by generation

| Generation | Pattern | Repos |
|---|---|---|
| Gen 3 — ICM engineering pipeline | thin routing `CLAUDE.md` + 6-stage `.icm/` with contracts, gates, runs | **sustentus** (reference impl, 11 runs) · **remi-ai** (specified, 0 runs) |
| Gen 2 — ICM business workspaces | 5-layer folder-is-the-architecture, no orchestration code | jamienisbet, barzinho, agorasim |
| Gen 1 — monolithic | one big always-loaded `CLAUDE.md` + copied skill library | courseday, tenderdesk |
| Gen 0 — stubs | `@AGENTS.md` one-liner or nothing | ~15 client sites (fine — build-once-hand-off) |

## Still open — security

- **P0** Sanity token still plaintext in `~/.claude.json.bak-20260715`; needs server-side revocation **and** the backup deleted.
- **P0** barzinho P&L PDFs are git-tracked — `.gitignore` pattern no longer matches after the move to `shared/profit-and-loss/`. Needs untrack + pattern fix + history scrub if the repo has a remote.
- **P1** dungeons-dragons: a Linear API key shipped in the public browser bundle via a `NEXT_PUBLIC_` prefix and has never been revoked (ticketed as DND-015).
- **P2** Over-broad grants: remi-ai `Bash(cat > *)` and home-wide `Read()`; `git push`/`gh pr merge` on allow.
- **P3** Orphaned vercel-plugin OAuth material in `~/.claude/.credentials.json`; `garmani/.env` is tracked.
- ✅ Global secrets deny-list now in place machine-wide (`.env*`, `*.pem`, `*.key`, `secrets/**`).

## Still open — broken config (pure fixes, no decision needed)

- sustentus: dead `impeccable` PostToolUse hook errors on **every** Edit/Write; two corrupted markdown tables; dead `architecture-map` + `automation-offload` links; orphaned `packages/ui/SKILL.md`.
- courseday: `CLAUDE.md` calls a `caveman-mode` skill that's named `caveman`; routes to a nonexistent `TICKETS.md`.
- remi-ai: `route-request.sh` present but unregistered while `SKILL.md` still expects it; `project-labels.sh` mislabelled read-only.
- Permission cruft: dead sustentus session grants + nonexistent scripts; tenderdesk's byte-copy of courseday's local settings; stale `~/.claude/projects/` memory dirs for pre-move paths.

## Still open — docs vs reality

The estate's consistent failure mode: **aspirational docs are richer than the running
system.** `/project` exists partly to attack this — the register records what is true, and
the run log dates it.

- sustentus `SKILLS.md` claims no test infrastructure — tests exist in `turbo.json` + CI.
- sustentus README (untouched since Jun 12) lists a nonexistent app, dead scripts, a pipeline shape that never existed.
- jamienisbet `.env.example` has **zero overlap** with the real `.env.local`.
- barzinho: the deployed `site/` app and the newest analysis file are invisible to the declared routing; deal terms duplicated in 4 files.
- learn-with-jake-van-clief: `CLAUDE.md`/`CONTEXT.md` are unfilled templates.

## Decisions needed from Jamie

1. **Skills layering** — repo forks vs global copies: global-only, repo-only, or documented shadowing rule?
2. **Pipeline upstream** — is Gen-3 a template product? If so, sustentus or remi-ai is canonical, and is remi-ai worth maintaining at zero runs?
3. **Hook strategy** — repo copies exist for web/cloud parity but have drifted 3 ways. Keep, drop, or generate from the global?
4. **Is merging a PR** an outward action Claude may take, or always yours?
5. **`gh` CLI** — banned by sustentus docs, granted in settings. Which is real?
6. **The ≤50-line `CLAUDE.md` rule** — teaching material says it, flagship repos break it. Which moves?
7. **barzinho** — is the deal still live? Gates the history-scrub urgency.
8. **Scheduled routines** — wanted in July, none exist. First candidate: a weekly automated re-run of this audit's checks.
9. **tenderdesk / courseday** — active, migrate, or archive?

## Done (don't re-litigate)

- Old vercel-plugin disabled · global `CLAUDE.md` created · Sanity MCP removed from live config · permissions deduplicated and tightened (2026-07-15).
- Global skills emptied to `~/.claude/skills-archive-2026-08-10/` · hook double-fire fixed (global defers to repo copy) · `settings.json` allow shrunk 53→9 with a deny-list added (2026-08-10).
- Client sites are build-once-hand-off — stub configs are fine, by Jamie's July answer.
- The ICM business factory retired (2026-08-12); the control layer is `_system/` + `.claude/`, not a factory.
- **jamienisbet** — question retired 2026-08-14: the repo *is* the estate control layer, so "run a client through it or freeze it" no longer applies.
- Six commands consolidated to three; `PROCESS.md` and `WORK-TRACKING.md` retired into the commands and the specs (2026-08-14).

---

*Decision-support only. Nothing here supersedes a repo's own contracts — the repo owns its
pipeline semantics.*
