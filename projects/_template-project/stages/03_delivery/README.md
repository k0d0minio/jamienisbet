# 03 Delivery — Handoff, Acceptance & Retrospective

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Hand the finished work to the client, capture formal acceptance against the agreed criteria, and run a short retrospective so the next project gets better.

## What this folder accomplishes
Final stage. The agent packages the build for handover (access, docs, credentials transfer notes), checks it against `01_discovery/output/success-criteria.md`, records the client's acceptance sign-off, and writes a retrospective. Acceptance here is the green light for final invoicing and the trigger to update the CRM-lite record. The retro feeds reusable lessons back into `shared/knowledge/` so Jamie's delivery improves over time.

## How it connects to the architecture
- **Upstream / reads from:** `02_build/output/` (the finished deliverable + notes) and `01_discovery/output/success-criteria.md` (the acceptance bar).
- **Downstream / feeds:** `workspaces/finance/` (final/closing invoice on accepted acceptance), `shared/clients/<client>/` (outcome + relationship status), and `../../output/` (project-level rollup). Lessons feed `shared/knowledge/`.
- **Draws on (Layer 3 reference):** `shared/templates/` (acceptance sign-off, handoff email), `_config/brand/voice/` (handoff comms), `_config/business/` (terms).

## Notes
Review gate (Principle 4): Jamie confirms acceptance and the final-invoice trigger. Any payment terms or commercial wording is decision-support only and must be reviewed against `_config/business/` and, where it has legal/financial weight, by a licensed Portuguese contabilista certificado / lawyer before sending.

> Contract: see [CONTEXT.md](CONTEXT.md).
