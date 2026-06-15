# 01 — Discovery — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): accepted proposal/scope from `workspaces/proposals/`; client notes
- Layer 3 (reference): `shared/templates/`, `shared/knowledge/`, `../../references/`

## Process
Capture requirements, define measurable success/acceptance criteria, list assumptions, dependencies, and out-of-scope items; produce a milestone outline and an access/dependency checklist. Flag anything that contradicts the signed proposal.

## Outputs
- `requirements.md` -> output/
- `success-criteria.md` -> output/
- `scope-and-assumptions.md` -> output/

## Integrations
- none

## Verify
- Acceptance criteria are testable and trace back to the signed proposal.
- Scope here does not exceed (or silently shrink) the proposal; any delta is flagged for re-quote in `workspaces/proposals/`.
- Required access/dependencies are listed before build starts.

## Review gate
- Jamie confirms scope here before `02_build/` begins. Any commercial change (rate, timeline) routes back to `workspaces/proposals/` and `workspaces/finance/`, not patched silently here.
