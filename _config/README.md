# Config — The Factory (Global Reference)

> **ICM role:** Layer 3 — reference
> **Purpose:** The single, stable source of truth every workspace, project, document template, and website draws on; change it once and the change propagates everywhere.

## What this folder accomplishes
`_config/` is the "factory" for Jamie Nisbet's Mafra-based software-engineering / AI-consulting business. It holds the things that stay stable across every run and every deliverable: the brand (how everything looks and sounds), the hard business facts (legal entity, NIF/VAT, address, IBAN, rates), and the ICM conventions that explain how the whole repo is wired together. Because every other folder points *here* for these answers, editing a token, a tone rule, or a rate in `_config/` updates proposals, quotes, invoices, contracts, and websites in one move — the "configure the factory, not the product" principle.

## How it connects to the architecture
- **Upstream / reads from:** human input; founder brief in [`_config/business/founder-brief.md`](business/).
- **Downstream / feeds:** [`shared/templates/`](../shared/templates/) (official documents), [`websites/`](../websites/), and every pipeline under [`workspaces/`](../workspaces/).
- **Draws on (Layer 3 reference):** itself — this is the root of all Layer 3 reference.

## Contents
- `brand/` — single source of truth for visual + verbal identity (see [`brand/`](brand/)).
- `business/` — legal-entity facts, rates, contact details, and `founder-brief.md`.
- `conventions/` — the ICM protocol localized to this repo; the explainer a new collaborator reads first.

## Notes
Treat everything here as the recipe, never the meal: no per-client or per-run content lives in `_config/`. That belongs in stage `output/` folders (Layer 4). Any financial, tax, or legal fact recorded under `business/` is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before it is acted on. When something is wrong in a deliverable, fix the source here (the "edit-source" principle) rather than patching the one-off output.
