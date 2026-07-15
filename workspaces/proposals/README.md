# Proposals — Negotiation-to-Close Workspace (Flagship)

> **ICM role:** Layer 1 — router
> **Status:** the run-process now lives in the **admin dashboard** — deals move through
> brainstorm → proposal → get-paid at `/deals`, and the AI generations load these stage contracts
> and references at run time (via `packages/icm`). This workspace remains the Layer-2/3 factory
> the dashboard's behaviour mirrors: fix a contract or reference here and the next generation
> changes with no code change.
> **Purpose:** Take a raw lead and walk it through an AI-coached negotiation pipeline that closes at a higher-than-usual rate, ending in proposal, quote, contract, and invoice.

## What this folder accomplishes
This is Jamie's flagship business-capability pipeline. It turns a networking/word-of-mouth lead into a won deal by (1) interrogating the deal exhaustively, (2) mapping where the leverage and power sit, (3) coaching Jamie through a live negotiation designed to anchor high and defend value over cost, then (4) producing the persuasive proposal, (5) the priced quote, (6) the contract, and (7) the closing invoice. The defining bias of this workspace: **ask as many questions as possible before advising**, and **never leave a target rate on the table**. Every deal is a self-contained run under `output/<client>/`.

## How it connects to the architecture
- **Upstream / reads from:** human input (a new lead); the client record in the admin dashboard (Neon `biz.clients`)
- **Downstream / feeds:** Stripe invoicing via the dashboard's get-paid step; the client's external delivery repo (seeded by the dashboard) once the deal is signed
- **Draws on (Layer 3 reference):** [`references/`](references/) (negotiation playbook + pricing models); [`shared/templates/`](../../shared/templates/) (master documents); [`_config/brand/voice/`](../../_config/brand/voice/) and [`_config/brand/visual/`](../../_config/brand/visual/) (on-brand output); [`_config/business/`](../../_config/business/) (rates, legal entity, founder-brief)

## Contents
- `setup/` — one-time factory configuration for this workspace (Principle 5)
- `stages/` — the ordered pipeline: `01_intake` → `07_invoice`
- `references/` — Layer 3 negotiation playbook and pricing models, stable across runs
- `output/` — Layer 4 per-deal runs, one folder per client

## Notes
Routing rule: a new lead always starts at `stages/01_intake/`. Each stage writes to its own `output/` and stops at a human review gate before the next stage runs. Stage `01_intake` and `03_negotiation_strategy` are the heavy-edit, high-stakes gates — slow down there. Legal/tax/financial content produced downstream is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before use.
