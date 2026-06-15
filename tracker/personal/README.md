# Personal Todos

> **ICM role:** Layer 4 — working (PRIVATE — walled off)
> **Purpose:** Jamie's purely personal todos and life admin, explicitly firewalled from every business output.

## What this folder accomplishes
This holds personal, non-business tasks and life admin: residency and document renewals, appointments, errands, household, family, anything in Jamie's personal life around Mafra. It exists so the morning brief can give a complete picture of the day, but it is the most strongly walled-off part of the repo.

## PRIVACY BOUNDARY — hard rule
- Content here **MUST NEVER** appear in, be quoted by, or be summarized into any business deliverable — no proposal, quote, contract, invoice, email, website, or client-facing artifact.
- No business workspace or project may read from `personal/`. The only reader is [`../routine/`](../routine/), and only to compose the private daily brief in [`../output/`](../output/).
- Data never flows from `personal/` upstream into the business. If a task here turns out to be business-relevant, it is re-entered by the human in [`../business/`](../business/); it is not copied or merged.

## How it connects to the architecture
- **Upstream / reads from:** human input ONLY
- **Downstream / feeds:** [`../routine/`](../routine/) → private personal section of the daily brief in [`../output/`](../output/)
- **Draws on (Layer 3 reference):** none — personal items carry no business reference

## Contents
- `todos.md` — open personal action items with optional due dates (planned; do not create)
- `done.md` — archive of completed personal items (planned; do not create)

## Notes
When the morning routine runs, personal items must stay in their own clearly labeled section and never bleed into business context. Treat this folder as private by default. Any health, legal, or financial personal note is for Jamie's reference only and is not advice; relevant matters require review by the appropriate licensed professional.
