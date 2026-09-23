# Knowledge map — what each stage reads, and where (Layer 3 reference, project-owned)

The router every stage loads to find its slice of this repo's knowledge. Project knowledge — what
the product is, who it serves, how it is built — is canonical in the docs tree named by
`docs_path` in `.icm/project.json` (or, for a repo without one, in `README.md` and the `AGENTS.md`
files); the pipeline never copies it into a contract, it reads it from here on demand. This file is
project-owned: it names this repo's pages, and the sync never touches it. Validate it with
`.icm/scripts/validate-knowledge-map.sh` whenever a page moves.

Paths below are relative to `docs_path`. A page named here must exist; a page that does not exist
here is not part of any stage's context budget.

## Where the knowledge lives

This repo has **no docs tree** (`docs_path` is empty, so `validate-knowledge-map.sh` reports SKIP).
Paths below are relative to the repo root.

- Identity, routing, standing rules — `AGENTS.md`
- Deployment, Vercel projects, build skipping — `websites/README.md`
- Each app — `websites/portfolio/README.md`, `websites/admin-dashboard/README.md`,
  `websites/sellers-site/README.md` (env vars each app needs, its routes)
- Brand and design system — `packages/ui/BRAND.md` (+ `packages/README.md`)
- Data model (`biz.*`) — `packages/services/README.md` and `packages/services/src/schema/`
- Direction of record — `.icm/docs/founder-brief.md`, `.icm/docs/decisions.md`

## What each stage reads

| Stage | Reads | Writes |
| --- | --- | --- |
| **Scope** (incl. the cut) | may read everything; prefers `AGENTS.md` and the app README the story touches | — (its artifacts are `.icm/runs/<slug>/01_scope/**` + `.icm/intake/<slug>/`) |
| **Define** | the app README(s) a spec `touches:`; `packages/services/README.md` for data | — |
| **Build** | the app README, `packages/ui/BRAND.md` for anything visual, `packages/services/README.md` for data; the code rules (`_shared/conventions.md` → `AGENTS.md`) | — |
| **Release** | the READMEs a shipped change makes stale | those READMEs; no changelog |
| **Knowledge lane** | exactly the one README the request names | that README; this map when one is added or removed |
