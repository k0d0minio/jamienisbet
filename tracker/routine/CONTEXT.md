# Tracker Routines — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `../business/` todo list; the generated `../../state/` dashboard
- Layer 3 (reference): `../../_config/conventions/`

## Process
Daily morning brief: (1) read the business todos; (2) scan `workspaces/` and `projects/` READ-ONLY for open items flagged as needing the human; (3) pull dated deadlines from `_config/business/` finance and the legal-and-tax `05_compliance_calendar`, and pipeline status from `state/`; (4) assemble today's list and compute what is overdue against the run date — prioritised: overdue invoices, today's deadlines, stalled deals. Friday: a deeper weekly review scanning the whole pipeline.

## Outputs
- `YYYY-MM-DD-brief.md` -> `../output/`

## Integrations
- none (all upstream scans are read-only; the run never writes outside `../output/`)

## Verify
- Every deadline cites its source path; overdue items are dated relative to the run date.
- All upstream scans are read-only; the run writes only to `../output/`.

## Review gate
- none (read-only scan + brief; auto-runs per the autonomy policy in review-gates.md).
