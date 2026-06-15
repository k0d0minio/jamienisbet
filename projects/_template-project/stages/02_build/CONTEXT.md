# 02 — Build — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `01_discovery/output/`
- Layer 3 (reference): `../../references/`, `_config/brand/`, `shared/knowledge/`

## Process
Track the build — which happens in the client's **external delivery repo**, not here — against the confirmed scope. Record technical decisions and trade-offs, milestone progress and percent-complete, and any blockers or scope deltas (route material changes back to `workspaces/proposals/`). Keep any client-facing artifacts on-brand.

## Outputs
- `technical-notes.md` -> output/
- `milestones.md` -> output/
- `build-log.md` -> output/  (decisions, blockers, scope questions)

## Integrations
- none

## Verify
- Every success criterion from `01_discovery/output/success-criteria.md` maps to tracked build work.
- Client-facing output matches `_config/brand/` tokens and voice rules.
- Milestones marked done are demonstrable in the external repo; nothing claimed complete that isn't.

## Review gate
- Jamie reviews milestone status before moving to handoff. If a milestone is invoiced interim, flag it for `workspaces/finance/`. Anything that changes price or timeline is a re-quote, not a quiet edit.
