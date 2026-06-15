# Clients — Shared Client Registry (CRM-lite)

> **ICM role:** Layer 3 — reference
> **Purpose:** Maintain one canonical record per client so every workspace — lead-gen, proposals, projects, finance — sees the same consistent view of who the client is and where each deal stands.

## What this folder accomplishes
This is the single source of truth for Jamie's clients and prospects. Since lead generation today is networking and word of mouth, each lead gets a folder here the moment it is **qualified** (the triage→proposals gate — see [`macro-pipeline.md`](../../_config/conventions/macro-pipeline.md)). Each client subfolder holds their contact details, a running history of interactions, the status of any active deal, the agreed scope and finances, and a pointer to their delivery pipeline — which runs in the client's **own external repo**, not here. Centralising this prevents the classic freelancer problem of a client's name, NIF, or agreed rate being slightly different in the proposal than in the invoice — every pipeline reads the same record, so the whole business stays in sync on each relationship.

## How it connects to the architecture
- **Upstream / reads from:** human input (business cards, calls, intros); `workspaces/lead-generation/` output when a lead is qualified.
- **Downstream / feeds:** `workspaces/proposals/` (who we are pitching), `workspaces/finance/` (bill-to identity), `projects/<client-or-project>/` (delivery), and `tracker/` when a follow-up becomes a todo.
- **Draws on (Layer 3 reference):** `_config/business/` for Jamie's own legal/bill-from identity to pair against the client's bill-to details.

## Contents
- `_template-client/` — the copy-me skeleton `new-client.sh` stamps out (never run in place).
- `<client-slug>/` — one folder per qualified client, created by [`scripts/new-client.sh`](../../scripts/new-client.sh):
  - `profile.md` — identity + state front-matter (contact, NIF/VAT, language, source of intro).
  - `history.md` — dated log of calls, meetings, emails, decisions.
  - `deals.md` — opportunities with status (`new`→`qualified`→`proposed`→`won`|`lost`).
  - `scope.md` — the agreed scope (the baton from proposals).
  - `finances.md` — quoted / billed / paid, mirroring the finance ledgers.
  - `repo-link.md` — pointer to the client's external delivery repo.

## Notes
Slugs follow [`_config/conventions/client-and-slug.md`](../../_config/conventions/client-and-slug.md): lowercase snake_case from the legal name, assigned by `new-client.sh`, collisions surfaced for human review. State front-matter and status sets follow [`state-and-status.md`](../../_config/conventions/state-and-status.md). One client folder, many projects: link each rather than duplicating its detail here. The actual delivery build lives in the client's **own external repo** — this repo keeps only scope + financial docs + the pointer. Client data is personal data — handle per [`governance.md`](../../_config/conventions/governance.md) (GDPR/RGPD), keeping only what the business needs. Any NIF/VAT or rate here is decision-support and must be confirmed against official records and reviewed by a licensed Portuguese contabilista certificado before it drives an invoice.
