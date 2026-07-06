# Tracker — Daily Operations

> **ICM role:** Layer 1 — router (standalone daily-ops hub)
> **Purpose:** A business-only checklist of what Jamie still has to do — the human's own todo list, kept separate from any workspace's internal state.

## What this folder accomplishes
This is Jamie's command center for day-to-day business todos: chase a lead, send an invoice, prep for a Mafra networking event, hit a compliance deadline. Items are typed by Jamie into [`business/`](business/) and may **link** to a workspace or project, but this list is not the source of truth for any pipeline — each workspace owns its own state, and **where the business stands (clients, deals, pipeline, metrics) is read live in the admin dashboard** ([`../websites/admin-dashboard/`](../websites/admin-dashboard/)), not scanned from the repo. The tracker is a **standalone hub**: it holds the human's checklist and never writes back into any workspace.

## How it connects to the architecture
- **Upstream / reads from:** human input (todos Jamie types).
- **Downstream / feeds:** the human (their working checklist); no business deliverable.
- **Draws on (Layer 3 reference):** [`../_config/conventions/`](../_config/conventions/) for ICM rules.

## Contents
- `business/` — the human's business todo list (`todos.md` open, `done.md` archive). Linked to workspaces, not their source of truth.

## Notes
The tracker is the human's checklist and returns to the human; nothing here merges back upstream. Pipeline status and metrics live in the admin dashboard — the tracker no longer scans the repo for them. Keep entries short and scannable. Finance/compliance dates noted here are decision-support reminders only — see [`../_config/conventions/governance.md`](../_config/conventions/governance.md).
