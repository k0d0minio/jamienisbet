# 02 Build — Delivery Work, Technical Notes & Milestones

> **ICM role:** Layer 2 — stage
> **Purpose:** Do the actual delivery work against the confirmed scope, tracking progress milestone-by-milestone and recording the technical decisions made along the way.

## What this folder accomplishes
The middle stage where Jamie builds. It consumes the confirmed scope from `01_discovery/output/` and produces the working deliverable plus a written trail: technical notes, architecture/stack decisions, milestone status, and any blockers or scope questions that surface mid-build. For AI-consulting engagements this is where prompts, model choices, evals, and integration work get logged so the handoff in `03_delivery/` is reproducible.

## How it connects to the architecture
- **Upstream / reads from:** `01_discovery/output/` (the confirmed brief) and `../../references/` (client brand + tech-stack decisions).
- **Downstream / feeds:** `03_delivery/` reads this stage's `output/`; completed milestones can trigger interim invoicing in `workspaces/finance/`.
- **Draws on (Layer 3 reference):** `_config/brand/visual/` + `_config/brand/voice/` (if the deliverable is client-facing), `shared/knowledge/` (build playbooks), `shared/templates/`.

## Stage contract
### Inputs
- Layer 4 (working): `01_discovery/output/`
- Layer 3 (reference): `../../references/`, `_config/brand/`, `shared/knowledge/`
### Process
Execute the build to scope; record technical decisions and trade-offs; track milestone progress and percent-complete; log blockers and any scope deltas (route material changes back to `workspaces/proposals/`). Keep client-facing artifacts on-brand.
### Outputs
- `technical-notes.md` -> output/
- `milestones.md` -> output/
- `build-log.md` -> output/  (decisions, blockers, scope questions)
### Verify
- Every success criterion from `01_discovery/output/success-criteria.md` maps to delivered build work.
- Client-facing output matches `_config/brand/` tokens and voice rules.
- Milestones marked done are demonstrable; nothing claimed complete that isn't.

## Notes
Review gate (Principle 4): Jamie reviews milestone status before moving to handoff. If a milestone is invoiced interim, flag it for `workspaces/finance/`. Anything that changes price or timeline is a re-quote, not a quiet edit.
