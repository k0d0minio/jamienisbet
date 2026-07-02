# @jamie-nisbet/icm — the ICM runtime for the admin dashboard

> **ICM role:** Layer 1 — package hub. The code bridge that lets the admin
> dashboard execute ICM stage contracts interactively. The folders stay the
> source of truth for *how* work is done; this package only loads them.

## What this package accomplishes
The admin dashboard generates pipeline documents (triage assessments, project
outlines, proposals, quotes, BRDs, negotiation strategies, mockups) with the
Vercel AI Gateway. Every generation must be driven by the same Layer‑3 context
an agent run would load — the stage's `CONTEXT.md`, the templates in
`shared/templates/`, the voice in `_config/brand/voice/`, the rates and setup
configs — not by ad‑hoc prompts. This package is that bridge:

- **`stageSpecs`** — the registry mapping each generatable document kind onto
  its governing stage contract and exactly the Layer‑3 files that contract
  names as Inputs ("one stage = one job", "load only the context the stage
  needs").
- **`assembleStageContext(kind)`** — reads those files from the repo and builds
  the system prompt. Layer‑4 (client, deal, prior approved documents) is
  supplied by the dashboard from the database as the user prompt.
- **`modelFor(kind)`** — the code mirror of
  [`_config/conventions/model-and-scaling.md`](../../_config/conventions/model-and-scaling.md):
  Opus-class for negotiation strategy and triage, cheaper tiers for the rest.
  Gateway model slugs, overridable via `AI_MODEL_HEAVY` / `AI_MODEL_STANDARD` /
  `AI_MODEL_FAST`.

## How it connects to the architecture
- **Reads (Layer 2–3, read-only):** `workspaces/*/stages/*/CONTEXT.md`,
  `workspaces/*/references/`, `workspaces/*/setup/output/`,
  `shared/templates/`, `_config/brand/voice/`, `_config/business/rates.md`,
  `packages/ui/tokens/` (mockup styling).
- **Consumed by:** `websites/admin-dashboard` (`app/api/ai/*` route handlers).
- **Never does:** touch the database, call the network, or write files. The
  outbound boundary and the review gates live in the dashboard's schema
  (`documents.status`) — see
  [`_config/conventions/scripts-and-integrations.md`](../../_config/conventions/scripts-and-integrations.md).

## Deployment note
On Vercel the repo markdown ships with the serverless functions via
`outputFileTracingIncludes` in the dashboard's `next.config.ts`, preserving
repo-relative paths. Add any newly referenced folder there too, or
`readRepoFile` will throw at runtime with a hint.

## Notes
Source-only, no build step (consumers transpile via `transpilePackages`).
Server-only — importing it from a client component fails at bundle time by
design (`node:fs`). Editing a referenced Layer‑3 file changes the next
generation with no code change: fix the source, not the symptom.
