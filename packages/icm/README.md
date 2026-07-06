# @jamie-nisbet/icm — the ICM runtime for the admin dashboard

> **ICM role:** Layer 1 — package hub. The code bridge that lets the admin
> dashboard execute ICM stage contracts interactively. The folders stay the
> source of truth for *how* work is done; this package only loads them.

## What this package accomplishes
The admin dashboard generates the deal pipeline's documents with the Vercel AI
Gateway. There are exactly five kinds — the code side of the workspace stage
contracts, in the order a deal moves through them:

| Kind | Job | From workspace |
|---|---|---|
| `triage` | Go/no-go fit assessment + a shareable note | `project-triage` |
| `pitch` | Prep for the informal first meeting | `proposals/01–02` |
| `negotiation` | Internal rate-lift strategy (never sent) | `proposals/03` |
| `proposal` | Client-facing write-up + payment schedule | `proposals/04` |
| `contract` | The legal agreement, from the approved proposal | `proposals/06` |

**Not** document kinds: `quote` and `invoice`. The deal's payment schedule is
the quote and Stripe is the invoice (the get-paid stage drives both) — a
markdown copy would be a second source of truth for money.

Every generation is driven by the same Layer‑3 context an agent run would load
— the stage's references, the templates in `shared/templates/`, the voice in
`_config/brand/voice/`, the rates and setup configs — not by ad‑hoc prompts.
This package is that bridge:

- **`stageSpecs`** — the registry mapping each generatable document kind onto
  its governing stage contract and exactly the Layer‑3 files that contract
  names as Inputs ("one stage = one job", "load only the context the stage
  needs").
- **`assembleStageContext(kind)`** — reads those files from the repo and builds
  the system prompt. Layer‑4 (client, deal, prior approved documents) is
  supplied by the dashboard from the database as the user prompt.
- **`modelFor(kind)`** — the code mirror of
  [`_config/conventions/model-and-scaling.md`](../../_config/conventions/model-and-scaling.md):
  Opus-class for the judgement-dense kinds (triage, pitch, negotiation),
  cheaper tiers for the template-driven assembly (proposal, contract). Gateway
  model slugs, overridable via `AI_MODEL_HEAVY` / `AI_MODEL_STANDARD` /
  `AI_MODEL_FAST`.

## How it connects to the architecture
- **Reads (Layer 2–3, read-only):** `workspaces/*/references/`,
  `workspaces/*/setup/output/`, `shared/templates/`, `_config/brand/voice/`,
  `_config/business/`.
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
