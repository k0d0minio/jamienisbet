# Business Identity — Hard Facts

> **ICM role:** Layer 3 — reference
> **Purpose:** The authoritative record of the legal/financial facts about Jamie's business — entity type, NIF/VAT, registered address, IBAN, rates, contact details — plus the founder's original brief.

## What this folder accomplishes
Every official document needs the same facts: who the legal entity is, its Portuguese tax number (NIF/VAT), its registered address in Mafra, the IBAN for payment, the standard day-rate and rate card, and contact details. This folder is the one place those facts live so a quote, contract, and invoice never disagree. It also holds `founder-brief.md`, the founder's original statement of intent that anchors the brand and the whole repo. Because the legal entity is not yet set up, this folder doubles as the working record of those facts as they get established.

## How it connects to the architecture
- **Upstream / reads from:** human input; the entity-setup pipeline under [`workspaces/`](../../workspaces/) once it produces decisions to record.
- **Downstream / feeds:** [`shared/templates/`](../../shared/templates/) (NIF/VAT, address, IBAN, rates printed on proposals/quotes/contracts/invoices), [`_config/brand/`](../brand/) (positioning), and [`websites/`](../../websites/) (contact/legal footer).
- **Draws on (Layer 3 reference):** [`_config/conventions/`](../conventions/) for how facts are recorded and cited.

## Contents
- `founder-brief.md` — the founder's original brief (created separately by the orchestrator; documented here, not authored here).
- [`rates.md`](rates.md) — standard rate (€120/h), flex levers, pricing approach, affiliate terms.
- [`contact.md`](contact.md) — name, email, location, language used on documents and sites.
- `entity.md` — legal entity type, NIF/VAT, registered Mafra address.  *(planned — pending entity setup)*
- `banking.md` — IBAN and payment details.  *(planned — pending entity setup)*

## Notes
Decision-support only: nothing in this folder is legal or tax advice. The entity type, VAT treatment, and any rate or tax figure must be reviewed and confirmed by a licensed Portuguese contabilista certificado / lawyer before being used on a real document. Do not assert specific tax figures or legal conclusions as fact here — record options and the source, and flag them for professional review.
