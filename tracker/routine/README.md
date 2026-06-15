# Morning Brief Routine

> **ICM role:** Layer 2 — stage (the every-morning run)
> **Purpose:** Specify exactly what the daily Claude run does — scan open items, list today's todos, surface what's overdue — and emit one dated brief.

## What this folder accomplishes
This holds the contract for the routine Jamie schedules to run each morning. The run reads the two task lists in this tracker, reaches READ-ONLY into the business folders for live deadlines, and writes a single brief to `../output/`. It is the one moving part of the standalone tracker; everything else is just data it reads.

## How it connects to the architecture
- **Upstream / reads from:** [`../business/`](../business/), [`../personal/`](../personal/); READ-ONLY: [`../../workspaces/`](../../workspaces/), [`../../projects/`](../../projects/), [`../../_config/business/`](../../_config/business/) finance, legal `05_compliance_calendar`
- **Downstream / feeds:** [`../output/`](../output/) (the dated brief)
- **Draws on (Layer 3 reference):** [`../../_config/conventions/`](../../_config/conventions/)

## Contents
- `routine.md` — the morning-brief spec: scan order, overdue logic, brief format (planned; do not create)

## Stage contract
### Inputs
- Layer 4 (working): `../business/`, `../personal/` task lists
- Layer 3 (reference): `../../_config/conventions/`
### Process
The agent (1) reads business and personal todos; (2) scans `workspaces/` and `projects/` READ-ONLY for open items flagged as needing the human; (3) pulls dated deadlines from `_config/business/` finance and the legal-and-tax `05_compliance_calendar`; (4) assembles today's list and computes what is overdue against today's date.
### Outputs
- `YYYY-MM-DD-brief.md` -> `../output/`
### Verify
- Business and personal items are kept in clearly labeled, separate sections.
- No personal item is written into any business folder; all upstream scans are read-only.
- Every deadline cites its source path; overdue items are dated relative to the run date.

## Notes
The run is the only writer in `tracker/`, and it writes ONLY to `../output/`. Compliance-calendar and finance dates are decision-support reminders only and require review by a licensed Portuguese contabilista certificado / lawyer; never assert tax figures or legal conclusions as fact.
