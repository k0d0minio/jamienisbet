# Stage 02 — Entity Options (Structure Decision, Recorded)

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Record the decided structure and the one open lever — not re-open a comparison (the decision is made).

## What this folder accomplishes
The comparison is done: Jamie registers as a self-employed **trabalhador independente** under the **regime simplificado** (see [`../../references/decision-basis.md`](../../references/decision-basis.md) and the root analysis). So this stage **records** that decision for the contabilista — the chosen status, the headline rationale (everything is drawn to live on, so a company's deferral advantage never activates; the simplified regime leaves ~17% of revenue untaxed), and the **one open lever**: the 0.75 vs 0.35 activity-code coefficient. It also confirms Stage 01 raised no revisit trigger. If a trigger *did* fire, this is where the comparison re-opens.

> **DISCLAIMER:** Decision-support only. The coefficient classification and final registration must be confirmed by a licensed Portuguese contabilista certificado. No figure here is asserted as fact.

## How it connects to the architecture
- **Upstream / reads from:** [`../01_discovery/output/`](../01_discovery/)
- **Downstream / feeds:** [`../03_setup_execution/`](../03_setup_execution/)
- **Draws on (Layer 3 reference):** [`../../references/decision-basis.md`](../../references/decision-basis.md), [`../../references/entity-structures.md`](../../references/entity-structures.md)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the decision record (chosen structure + the coefficient question)

## Notes
A record, not a re-derivation — unless a Stage 01 revisit trigger fired. The folder keeps its historical name; its job is now "decision recorded".

> Contract: see [CONTEXT.md](CONTEXT.md).
