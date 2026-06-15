# 02 Build — Delivery Tracking, Technical Notes & Milestones

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Track the delivery work — done in the client's external repo — against the confirmed scope, recording technical decisions and milestone progress as it goes.

## What this folder accomplishes
The middle stage. The actual build happens in the client's **own external delivery repo** (its own ICM pipeline); this stage keeps the in-repo tracking record: technical notes, architecture/stack decisions, milestone status, and any blockers or scope questions that surface mid-build. For AI-consulting engagements this is where model choices, evals, and integration decisions get logged so the handoff in `03_delivery/` is reproducible. No delivery code lives here — only the coordination trail.

## How it connects to the architecture
- **Upstream / reads from:** `01_discovery/output/` (the confirmed brief) and `../../references/` (client brand + tech-stack decisions).
- **Downstream / feeds:** `03_delivery/` reads this stage's `output/`; completed milestones can trigger interim invoicing in `workspaces/finance/`.
- **Draws on (Layer 3 reference):** `_config/brand/visual/` + `_config/brand/voice/` (if the deliverable is client-facing), `shared/knowledge/` (build playbooks), `shared/templates/`.

## Notes
Review gate (Principle 4): Jamie reviews milestone status before moving to handoff. If a milestone is invoiced interim, flag it for `workspaces/finance/`. Anything that changes price or timeline is a re-quote, not a quiet edit.

> Contract: see [CONTEXT.md](CONTEXT.md).
