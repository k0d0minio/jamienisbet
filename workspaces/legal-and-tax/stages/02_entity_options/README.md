# Stage 02 — Entity Options

> **ICM role:** Layer 2 — stage
> **Purpose:** Present the Portuguese business structures available to Jamie as clear trade-offs — never a single prescribed answer.

## What this folder accomplishes
Using the situation brief, the agent lays out the realistic structures for a Mafra-based software / AI consultant and compares them so Jamie (with his contabilista) can choose. At minimum it contrasts: sole trader / **trabalhador independente (ENI)** vs a limited company / **Sociedade por Quotas (Lda.)**; **simplified** vs **organised** accounting regimes; and any applicable **incentive regimes** he may or may not qualify for. Each option is scored on take-home impact, liability protection, admin burden, social-security treatment, credibility with clients, and cost to run. The deliverable is a comparison plus a recommended *direction* with explicit caveats — the binding decision is the contabilista's.

> **DISCLAIMER:** Decision-support only. Eligibility, thresholds, and rates are situation-specific and change — confirm every figure with a licensed Portuguese contabilista certificado / lawyer. No tax figure or legal conclusion here is asserted as fact.

## How it connects to the architecture
- **Upstream / reads from:** [`../01_discovery/output/`](../01_discovery/)
- **Downstream / feeds:** [`../03_setup_execution/`](../03_setup_execution/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/)

## Contents
- `output/` — the entity comparison and recommended direction

## Stage contract
### Inputs
- Layer 4 (working): `../01_discovery/output/situation-brief.md`
- Layer 3 (reference): `../../references/`
### Process
Build an options matrix (ENI vs Lda.; simplified vs organised; incentive regimes). Map each to Jamie's revenue band, client geography, and risk appetite. Mark eligibility items as "to confirm with contabilista."
### Outputs
- `entity-comparison.md` -> output/
- `recommended-direction.md` -> output/
### Verify
- At least two structures and both accounting regimes are compared; every claim traces to `../../references/` or is flagged unconfirmed; no single answer presented as final without the contabilista caveat.

## Notes
Trade-offs over verdicts. Revisit when revenue crosses a threshold that changes the optimal regime.
