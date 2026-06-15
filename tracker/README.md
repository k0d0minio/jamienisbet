# Tracker — Daily Operations

> **ICM role:** Layer 1 — router (standalone daily-ops hub)
> **Purpose:** A business-only daily todo + morning-brief system: the every-morning routine scans what's open across the repo (read-only) and emits one brief of today's todos and anything overdue.

## What this folder accomplishes
This is Jamie's command center for getting things done day to day. A Claude routine runs every morning, scans what is open across the repo (READ-ONLY), and produces a single brief listing today's todos and anything overdue — chase a lead, send an invoice, prep for a Mafra networking event, hit a compliance deadline. A Friday weekly-review routine does a deeper scan of the whole pipeline. The tracker is a **standalone hub**: it is the human's checklist, not the source of truth for any workspace (each workspace owns its own state). It reads business state read-only; it never writes back into it.

## How it connects to the architecture
- **Upstream / reads from:** human input (todos Jamie types); READ-ONLY scans of [`workspaces/`](../workspaces/), [`projects/`](../projects/), [`shared/clients/`](../shared/clients/), [`state/`](../state/), [`_config/business/`](../_config/business/) finance, and legal `05_compliance_calendar`
- **Downstream / feeds:** the human (the morning brief + weekly review); no business deliverable
- **Draws on (Layer 3 reference):** [`_config/conventions/`](../_config/conventions/) for ICM rules

## Contents
- `routine/` — the morning-brief + weekly-review run specs (scan, list, surface overdue).
- `business/` — the human's business todo list (linked to workspaces, not their source of truth).
- `output/` — archive of dated briefs, one per run (Layer 4).

## Notes
The tracker reads the business read-only and returns to the human; nothing here is merged back upstream. Todos arrive two ways: Jamie types them in `business/`, and the routine proposes them from pipeline state ([`state/`](../state/)). Keep entries short and scannable so the daily brief stays fast. Finance/compliance dates surfaced here are decision-support reminders only — see [`_config/conventions/governance.md`](../_config/conventions/governance.md).
