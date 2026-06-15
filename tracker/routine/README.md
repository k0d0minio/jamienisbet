# Morning Brief & Weekly Review Routines

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Specify exactly what the scheduled Claude runs do — scan open items, list today's todos, surface what's overdue — and emit one dated brief.

## What this folder accomplishes
This holds the contract for the routines Jamie schedules: a **daily morning brief** and a **Friday weekly review**. Each reads the business todo list, reaches READ-ONLY into the business folders and the [`state/`](../../state/) dashboard for live deadlines and pipeline status, and writes a single brief to `../output/`. It is the one moving part of the tracker; everything else is just data it reads. The scans are read-only, so the runs need no review gate.

## How it connects to the architecture
- **Upstream / reads from:** [`../business/`](../business/); READ-ONLY: [`../../workspaces/`](../../workspaces/), [`../../projects/`](../../projects/), [`../../shared/clients/`](../../shared/clients/), [`../../state/`](../../state/), [`../../_config/business/`](../../_config/business/) finance, legal `05_compliance_calendar`
- **Downstream / feeds:** [`../output/`](../output/) (the dated brief)
- **Draws on (Layer 3 reference):** [`../../_config/conventions/`](../../_config/conventions/)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract for the runs.
- `routine.md` — the morning-brief + weekly-review spec: scan order, overdue logic, brief format (planned; do not create).

## Notes
The runs are the only writer in `tracker/`, and they write ONLY to `../output/`. Compliance-calendar and finance dates are decision-support reminders only — see [`../../_config/conventions/governance.md`](../../_config/conventions/governance.md).

> Contract: see [CONTEXT.md](CONTEXT.md).
