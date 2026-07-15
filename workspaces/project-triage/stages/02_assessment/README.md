# Stage 02 — Assessment

> **ICM role:** Layer 2 — stage (narrative; contract in CONTEXT.md)
> **Purpose:** Evaluate the captured idea against the rubric — strategic fit, effort vs reward, profitability, technical risk — and scan whether a better/existing solution already solves it (build vs buy vs redirect).

## What this folder accomplishes
This stage turns the intake note into a scored, defensible read. The agent rates the idea on each rubric dimension using Jamie's configured weights, then does an honest market scan: does an off-the-shelf product, SaaS, or open-source tool already solve this well enough that Jamie should redirect the customer rather than build? It cross-references past delivered engagements (client repos linked on `biz.clients`) so portfolio fit and reuse are factored in. The result is the analytical backbone for the go/no-go and the customer feedback.

## How it connects to the architecture
- **Upstream / reads from:** [`../01_intake/output/`](../01_intake/output/); portfolio context from past delivered engagements; [`../../setup/`](../../setup/) thresholds and weights
- **Downstream / feeds:** [`../03_recommendation/`](../03_recommendation/) reads this stage's `output/`
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) scoring rubric + decision criteria; [`_config/business/founder-brief.md`](../../../../_config/business/founder-brief.md)

## Contents
- [`CONTEXT.md`](CONTEXT.md) — the Layer 2 contract this stage executes.
- `output/` — the scored assessment per idea (Layer 4 handoff)
- `assessment-template.md` — planned: scorecard structure + build-vs-buy-vs-redirect scan section

## Notes
Be ruthless and fast — the value is an honest read, including telling Jamie to walk away or redirect. Profitability and rate commentary are planning estimates only; any figure with tax/financial implications must be reviewed by a licensed Portuguese contabilista certificado before action.

> Contract: see [CONTEXT.md](CONTEXT.md).
