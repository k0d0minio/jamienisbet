# Stage 05 — Compliance Calendar

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Generate the recurring filing deadlines for the chosen structure, as a reviewed markdown calendar whose entries Jamie enters into the dashboard's `/today` compliance calendar (`biz.compliance_dates`).

## What this folder accomplishes
The final stage turns the obligations of a simplified-regime *trabalhador independente* into a dated calendar so nothing is missed. It lays out: **quarterly Segurança Social declarations** (Apr / Jul / Oct / Jan) once the **12-month year-1 exemption ends** (note that end date prominently); the **annual IRS Modelo 3 + Anexo B**; and the **periodic IVA declarations + recapitulative (VIES) statements** for foreign-client services. Each entry has a due date, what is filed, who files it (Jamie vs contabilista), and a buffer reminder. This is the workspace's hand-off into day-to-day operations.

> **DISCLAIMER:** Decision-support only. The final cadence depends on the confirmed regime and IVA periodicity — a licensed Portuguese contabilista certificado must validate the calendar.

## How it connects to the architecture
- **Upstream / reads from:** [`../03_setup_execution/output/`](../03_setup_execution/) and [`../04_tax_optimization/output/`](../04_tax_optimization/)
- **Downstream / feeds:** the dashboard's `/today` compliance calendar (deadline surfacing in the morning brief); [`workspaces/finance/`](../../../finance/) (filing/payment scheduling)
- **Draws on (Layer 3 reference):** [`../../references/social-security-notes.md`](../../references/social-security-notes.md), [`../../references/iva-vat-notes.md`](../../references/iva-vat-notes.md)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the generated compliance calendar

## Notes
Regenerate when the regime, IVA periodicity, or the law changes. The tracker reads this **read-only** — it does **not** auto-feed Google Calendar (per the decision).

> Contract: see [CONTEXT.md](CONTEXT.md).
