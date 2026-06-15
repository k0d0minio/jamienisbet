# Clients — Shared Client Registry (CRM-lite)

> **ICM role:** Layer 3 — reference
> **Purpose:** Maintain one canonical record per client so every workspace — lead-gen, proposals, projects, finance — sees the same consistent view of who the client is and where each deal stands.

## What this folder accomplishes
This is the single source of truth for Jamie's clients and prospects. Since lead generation today is networking and word of mouth, each new contact gets a folder here the moment they become a real lead. Each client subfolder holds their contact details, a running history of interactions, the status of any active deal, and links out to their delivery pipeline under `projects/`. Centralising this prevents the classic freelancer problem of a client's name, NIF, or agreed rate being slightly different in the proposal than in the invoice — every pipeline reads the same record, so the whole business stays in sync on each relationship.

## How it connects to the architecture
- **Upstream / reads from:** human input (business cards, calls, intros); `workspaces/lead-generation/` output when a lead is qualified.
- **Downstream / feeds:** `workspaces/proposals/` (who we are pitching), `workspaces/finance/` (bill-to identity), `projects/<client-or-project>/` (delivery), and `tracker/` when a follow-up becomes a todo.
- **Draws on (Layer 3 reference):** `_config/business/` for Jamie's own legal/bill-from identity to pair against the client's bill-to details.

## Contents
- `<client-slug>/` — one folder per client; planned to contain the files below.
- `<client-slug>/profile.md` — planned: contact info, company, NIF/VAT, language, source of intro.
- `<client-slug>/history.md` — planned: dated log of calls, meetings, emails, decisions.
- `<client-slug>/deals.md` — planned: active opportunities, stage, expected value, next action.
- `_template-client/` — planned: copy-this skeleton for onboarding a new client consistently.

## Notes
Use a lowercase, snake_case slug per client (e.g. `acme_lda/`) matching the matching folder under `projects/` so cross-links are predictable. One client folder, many projects: link each project rather than duplicating its detail here. Client data is personal data — handle per GDPR/RGPD and keep only what the business needs. Any NIF/VAT or rate captured here is decision-support and must be confirmed against official records and reviewed by a licensed Portuguese contabilista certificado before it drives an invoice.
