# Templates — Master Document Templates

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the master, on-brand document templates (proposal, quote, contract, work-order, invoice, email) that proposal and finance pipelines fill in, so every document Jamie sends looks and reads the same.

## What this folder accomplishes
These are the reusable "recipes" for every official document the business produces. A template defines the structure and the on-brand styling; a workspace fills it with a specific client's details to produce a finished deliverable. Each template pulls its visual identity (colour, type, logo, design tokens) from `_config/brand/visual/` and its tone and copy rules from `_config/brand/voice/`, so a quote, a contract, and an invoice for the same client all feel like one coherent brand. Centralising the templates here means a brand or rate change is made once and every future document inherits it, rather than being copy-pasted across pipelines.

## How it connects to the architecture
- **Upstream / reads from:** `_config/brand/visual/`, `_config/brand/voice/`, `_config/brand/assets/` (logos/letterhead), `_config/business/` (legal entity, NIF/VAT, IBAN, rates).
- **Downstream / feeds:** `workspaces/proposals/` (proposal, quote, contract, work-order, follow-up emails) and `workspaces/finance/` (invoices); filled-in documents land as Layer 4 in those workspaces' `output/` folders.
- **Draws on (Layer 3 reference):** the client record in the admin dashboard (Neon `biz.clients`) supplies the bill-to / recipient details at fill-in time.

## Contents
- [`proposal.md`](proposal.md) — scope, approach, tiered options, terms; the main sales document.
- [`quote.md`](quote.md) — itemised good/better/best price with the foreign-client IVA note.
- [`work-order.md`](work-order.md) — the agreed scope of a specific piece of work.
- [`brd.md`](brd.md) — business requirements document: the customer-consumable translation of an
  approved project outline (goals, deliverables, acceptance criteria, assumptions) — business
  language only, no internal rates or effort maths. Filled by the admin dashboard's ICM pipeline.
- [`contract.md`](contract.md) — master engagement terms (IP, payment, liability, PT law); lawyer-review base.
- [`invoice.md`](invoice.md) — billing document; NIF/IBAN pending entity setup; reverse-charge / out-of-scope IVA.
- `email/` — [`outreach.md`](email/outreach.md), [`follow-up.md`](email/follow-up.md), [`chase.md`](email/chase.md) (invoice chaser).

## Notes
Templates are Layer 3 reference and stay stable across runs; a filled-in document for one client is Layer 4 output and never lives here. Use `{{namespace.field}}` placeholder tokens so pipelines populate them mechanically: `{{client.*}}` (from the `biz.clients` record, via the admin dashboard), `{{business.*}}` (email/rate now; NIF/IBAN pending entity setup, from `_config/business/`), `{{deal.*}}` / `{{tier.*}}` / `{{price.*}}` (from the proposals run), `{{terms.*}}`, `{{invoice.*}}`, `{{date}}`, and `{{iva.*}}` (the reverse-charge / out-of-scope note from [`workspaces/legal-and-tax/references/iva-vat-notes.md`](../../workspaces/legal-and-tax/references/iva-vat-notes.md)). Client-facing copy follows [`_config/brand/voice/`](../../_config/brand/voice/); client sites and any styled render resolve tokens from [`_config/brand/visual/`](../../_config/brand/visual/). Invoice and contract templates encode tax/legal structure — decision-support only; the resulting documents must be reviewed by a licensed Portuguese contabilista certificado / lawyer before being sent.
