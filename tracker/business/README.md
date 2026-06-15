# Business Todos

> **ICM role:** Layer 4 — working
> **Purpose:** Jamie's own list of business action items — the things HE needs to do, distinct from any workspace's internal state.

## What this folder accomplishes
This is where business tasks live as the human's own checklist: chase a lead, send a proposal, follow up on an unpaid invoice, prep for a networking event in Mafra. Items may be **linked** to a workspace or project (e.g. "review the draft in `projects/<client>/`"), but this list is NOT the source of truth for any pipeline — each workspace owns its own state. This is simply what Jamie still has to do.

## How it connects to the architecture
- **Upstream / reads from:** human input; references to [`../../workspaces/`](../../workspaces/) and [`../../projects/`](../../projects/)
- **Downstream / feeds:** [`../routine/`](../routine/) reads these into the daily brief
- **Draws on (Layer 3 reference):** [`../../shared/clients/`](../../shared/clients/) for client names; [`../../_config/conventions/`](../../_config/conventions/)

## Contents
- `todos.md` — open business action items with optional due dates and workspace links (planned; do not create)
- `done.md` — archive of completed business items (planned; do not create)

## Notes
Linking is one-directional: an item here may POINT to a workspace or project, but doing the task means working in that workspace — not here. Keep entries to one line each so the morning brief stays scannable. These items sit inside the standalone tracker and never merge back into a deliverable. Finance and tax reminders that surface here are decision-support only and require review by a licensed Portuguese contabilista certificado / lawyer.
