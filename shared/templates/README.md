# Templates — Master Document Templates

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the master, on-brand document templates (proposal, quote, contract, work-order, invoice, email) that proposal and finance pipelines fill in, so every document Jamie sends looks and reads the same.

## What this folder accomplishes
These are the reusable "recipes" for every official document the business produces. A template defines the structure and the on-brand styling; a workspace fills it with a specific client's details to produce a finished deliverable. Each template pulls its visual identity (colour, type, logo, design tokens) from `_config/brand/visual/` and its tone and copy rules from `_config/brand/voice/`, so a quote, a contract, and an invoice for the same client all feel like one coherent brand. Centralising the templates here means a brand or rate change is made once and every future document inherits it, rather than being copy-pasted across pipelines.

## How it connects to the architecture
- **Upstream / reads from:** `_config/brand/visual/`, `_config/brand/voice/`, `_config/brand/assets/` (logos/letterhead), `_config/business/` (legal entity, NIF/VAT, IBAN, rates).
- **Downstream / feeds:** `workspaces/proposals/` (proposal, quote, contract, work-order, follow-up emails) and `workspaces/finance/` (invoices); filled-in documents land as Layer 4 in those workspaces' `output/` folders.
- **Draws on (Layer 3 reference):** `shared/knowledge/` for reusable copy blocks; `shared/clients/` supplies the bill-to / recipient details at fill-in time.

## Contents
- `proposal.md` — planned: scope, approach, pricing, terms; the main sales document.
- `quote.md` — planned: lightweight itemised price estimate.
- `contract.md` — planned: engagement terms, deliverables, IP, payment schedule.
- `work-order.md` — planned: agreed scope of a specific piece of work.
- `invoice.md` — planned: billing document keyed to `_config/business/` for NIF/VAT/IBAN.
- `email/` — planned: outreach, follow-up, and chase templates aligned to brand voice.

## Notes
Templates are Layer 3 reference and stay stable across runs; a filled-in document for one client is Layer 4 output and never lives here. Use placeholder tokens (e.g. `{{client.name}}`, `{{rate}}`) so pipelines can populate them mechanically from `shared/clients/` and `_config/business/`. Invoice and contract templates encode tax/legal structure — they are decision-support only and the resulting documents must be reviewed by a licensed Portuguese contabilista certificado / lawyer before being sent.
