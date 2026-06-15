# Stage 05 — Compliance Calendar

> **ICM role:** Layer 2 — stage
> **Purpose:** Generate Jamie's recurring filing deadlines and push them into the systems that track and act on them.

## What this folder accomplishes
This final stage converts the entity's obligations into a dated calendar so nothing is missed and no late penalties are incurred. Based on the chosen structure and regime, it lays out the cadence for **IVA/VAT** returns (monthly or quarterly), **IRS** (annual personal income tax and any payments on account), **Segurança Social** monthly contributions and the periodic quarterly declaration, and any annual filings (e.g., IES / SAF-T where applicable). Each entry has a due date, what's filed, who files it (Jamie vs contabilista), and a buffer reminder. This is the bridge from the legal workspace into day-to-day operations.

> **DISCLAIMER:** Decision-support only. Deadlines and obligation cadences depend on the confirmed regime and change by law — a licensed Portuguese contabilista certificado must validate the final calendar.

## How it connects to the architecture
- **Upstream / reads from:** [`../03_setup_execution/output/`](../03_setup_execution/) and [`../04_tax_optimization/output/`](../04_tax_optimization/)
- **Downstream / feeds:** [`tracker/`](../../../../tracker/) (deadline reminders for the morning routine) and [`workspaces/finance/`](../../../finance/) (filing/payment scheduling)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/)

## Contents
- `output/` — the generated compliance calendar

## Stage contract
### Inputs
- Layer 4 (working): confirmed entity form, regime, IVA periodicity
- Layer 3 (reference): `../../references/`
### Process
Map each obligation (IVA, IRS, Segurança Social, annual filings) to its cadence and due dates with owner and buffer; format so `tracker/` and `workspaces/finance/` can consume it.
### Outputs
- `compliance-calendar.md` -> output/
### Verify
- Cadence matches the regime confirmed in Stage 03; no obligation orphaned; dates align with what feeds `tracker/`; every date flagged "confirm with contabilista."

## Notes
Regenerate when the regime, IVA periodicity, or the law changes. This is the workspace's hand-off into recurring operations.
