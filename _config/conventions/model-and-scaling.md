# Model Policy, the New-Workspace Rule & Validation

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** Which model to use for what, when a need earns its own workspace, and the checklist a new workspace must pass before real use.

## Model policy
- **Heavy reasoning** (Opus-class) for **negotiation strategy** and **project-triage assessment** —
  judgment-dense, high-stakes, low volume.
- **Cheaper / faster** models for **formatting, ledger maths, read-only scans, slug derivation,
  mechanical extraction** — deterministic, high volume.
- The orchestrating agent may delegate sub-tasks within a stage to cheaper sub-agents (ICM §4.1),
  driven by the same folder structure.

## New-workspace rule
A recurring need becomes **its own workspace** when it has: **its own `setup/` config + ≥3 stages +
runs independently** of any other pipeline. Below that bar, it's a **stage** inside an existing
workspace. (Avoids both a sprawl of thin workspaces and overloaded mega-stages.)

## Workspace validation checklist
Before a new workspace is used on a real client, confirm:
- [ ] `setup/questionnaire.md` exists and is filled (factory configured once).
- [ ] Every stage has a `README.md` (narrative) **and** a `CONTEXT.md` (six-section contract).
- [ ] Every `CONTEXT.md` has layer-tagged Inputs, a non-empty `Verify`, and an explicit
      `Review gate`.
- [ ] Stage N's `Outputs` match stage N+1's `Inputs` (the chain connects).
- [ ] `references/` holds the rules the stages cite; client-facing output resolves brand from
      `_config/brand/`.
- [ ] The workspace `README.md` router lists the real stages in order.
- [ ] Any `Integrations` are declared and respect the outbound boundary.

Related: [`building-a-workspace.md`](building-a-workspace.md) · [`stage-contracts.md`](stage-contracts.md)
