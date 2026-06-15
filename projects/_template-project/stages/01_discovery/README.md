# 01 Discovery — Requirements, Scope & Success Criteria

> **ICM role:** Layer 2 — stage
> **Purpose:** Turn the signed proposal into a confirmed, testable scope: what we are building, what done looks like, and what is explicitly out of scope.

## What this folder accomplishes
First stage of delivery. The agent re-reads the accepted proposal with the client (or Jamie's notes from a kickoff call) and pins down concrete requirements, success/acceptance criteria, assumptions, and constraints — before any build starts. This is where scope creep is fenced off and where the acceptance bar for `03_delivery/` is set. For Jamie's AI-consulting work this is also where model/data access, integrations, and environment access are nailed down.

## How it connects to the architecture
- **Upstream / reads from:** the accepted proposal in `workspaces/proposals/`, the client record in `shared/clients/<client>/`, and `../../references/`.
- **Downstream / feeds:** `02_build/` reads this stage's `output/` as its brief.
- **Draws on (Layer 3 reference):** `shared/templates/` (work-order template), `shared/knowledge/` (discovery playbooks), `_config/business/` (rates, terms).

## Stage contract
### Inputs
- Layer 4 (working): accepted proposal/scope from `workspaces/proposals/`; client notes
- Layer 3 (reference): `shared/templates/`, `shared/knowledge/`, `../../references/`
### Process
Capture requirements, define measurable success/acceptance criteria, list assumptions, dependencies, and out-of-scope items; produce a milestone outline and an access/dependency checklist. Flag anything that contradicts the signed proposal.
### Outputs
- `requirements.md` -> output/
- `success-criteria.md` -> output/
- `scope-and-assumptions.md` -> output/
### Verify
- Acceptance criteria are testable and trace back to the signed proposal.
- Scope here does not exceed (or silently shrink) the proposal; any delta is flagged for re-quote in `workspaces/proposals/`.
- Required access/dependencies are listed before build starts.

## Notes
Review gate (Principle 4): Jamie confirms scope here before `02_build/` begins. Any commercial change (rate, timeline) routes back to `workspaces/proposals/` and `workspaces/finance/`, not patched silently here.
