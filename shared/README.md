# Shared — Cross-Workspace Building Blocks

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the reusable building blocks (document templates) that every workspace and the admin dashboard's AI pipeline draw on, so the whole business works from one consistent set of parts.

## What this folder accomplishes
`shared/` is the library of stable, reusable pieces that more than one pipeline needs. Where `_config/` answers **who Jamie's business is** (legal identity, brand, founder brief, ICM conventions — the factory configuration), `shared/` answers **what reusable parts the pipelines assemble from**: the master document templates that proposals, contracts and invoices are built from. Keeping these here means every workspace run and every dashboard AI generation references the same on-brand templates, instead of each pipeline inventing its own copy. (Client and deal records themselves live in the Neon `biz.*` schema, operated through the admin dashboard — not here; see [`_config/conventions/state-and-status.md`](../_config/conventions/state-and-status.md).) Everything here is stable across runs — it changes when the business changes, not on every deal.

## How it connects to the architecture
- **Upstream / reads from:** `_config/brand/` (visual + voice), `_config/business/` (identity facts), `_config/conventions/`; human edits.
- **Downstream / feeds:** every `workspaces/<name>/` pipeline (lead-generation, proposals, finance, etc.) and the admin dashboard's AI generations (via `packages/icm`).
- **Draws on (Layer 3 reference):** `_config/brand/visual/`, `_config/brand/voice/`, `_config/business/`.

## Contents
- `templates/` — master proposal, quote, contract, work-order, invoice, and email templates.

## Notes
`shared/` is reference (Layer 3), never per-run output — filled-in deliverables are Layer 4 and live in a workspace's `output/`. Rule of thumb: if a thing is reused across pipelines and stays stable between runs, it belongs here; if it is tightly scoped to one pipeline, it belongs in that workspace's own `references/`. Any template or playbook touching tax, legal, or financial matters is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before use.
