# Tracker — Standalone Daily Operations

> **ICM role:** Layer 1 — router (standalone entity)
> **Purpose:** A walled-off daily todo + morning-brief system that tracks both business and personal tasks for Jamie, kept deliberately separate from the rest of the business data.

## What this folder accomplishes
This is Jamie's personal command center for getting things done day to day. A Claude routine runs every morning, scans what is open across the repo (read-only), and produces a single brief listing today's todos and anything overdue. It mixes business action items (follow up with a lead, send an invoice) and purely personal life admin (renew the residence card, book a dentist). Because it holds personal data, it is a **standalone entity**, not part of any business pipeline.

## STANDALONE / PRIVACY BOUNDARY — read this first
- `tracker/` is **separated from the business**. It is a private task list, NOT a source of truth for any workspace, project, or deliverable.
- The morning routine MAY **reference** business folders (`workspaces/`, `projects/`, `_config/business/finance`, legal `05_compliance_calendar`) **READ-ONLY** to surface deadlines. It must never write into them.
- `tracker/personal/` content **MUST NEVER** leak into any business output — no proposal, invoice, email, website, or client-facing artifact may quote, summarize, or embed personal items.
- Data flows business → tracker (as references), **never** tracker/personal → business. Nothing here is merged back upstream.

## How it connects to the architecture
- **Upstream / reads from:** human input; READ-ONLY scans of [`workspaces/`](../workspaces/), [`projects/`](../projects/), [`_config/business/`](../_config/business/) finance, and legal `05_compliance_calendar`
- **Downstream / feeds:** the human (the morning brief); no business deliverable
- **Draws on (Layer 3 reference):** [`_config/conventions/`](../_config/conventions/) for ICM rules

## Contents
- `routine/` — the every-morning Claude run spec (scan, list, surface overdue)
- `business/` — business todos (linked from workspaces, not a workspace source of truth)
- `personal/` — purely personal todos and life admin, walled off
- `output/` — archive of daily briefs, one per day (Layer 4)

## Notes
Treat the personal/business split as a hard firewall. When the morning run is asked to act on a business task it may read business context, but it returns to the human here, never the other way around. Keep entries short and scannable so the daily brief stays fast.
