# Stage 02 — Deal Analysis (Leverage Map)

> **ICM role:** Layer 2 — stage
> **Purpose:** Turn the deal dossier into a leverage map — where the power sits, what each side's walk-away is, and what the work is really worth to the client.

## What this folder accomplishes
This stage converts raw discovery into negotiating intelligence. The agent estimates the client's BATNA (their best alternative if they don't hire Jamie) and Jamie's own BATNA, models the value the project creates for the client (so price can be framed against value, not cost), gauges price sensitivity from the budget signals, lists the deal's risks and red flags, and judges where the leverage actually sits. It is analysis only — no tactics yet. The output is the factual basis the negotiation coach reasons from.

## How it connects to the architecture
- **Upstream / reads from:** [`../01_intake/output/`](../01_intake/) (`deal-dossier.md`)
- **Downstream / feeds:** [`../03_negotiation_strategy/`](../03_negotiation_strategy/)
- **Draws on (Layer 3 reference):** [`../../references/`](../../references/) (value-estimation and price-sensitivity models); [`../../setup/`](../../setup/) (Jamie's floor, which informs his BATNA)

## Contents
- `output/` — Layer 4: the leverage map for this deal.

## Stage contract
### Inputs
- Layer 4 (working): [`../01_intake/output/`](../01_intake/) deal dossier
- Layer 3 (reference): pricing/value models in [`../../references/`](../../references/)
### Process
Derive client BATNA and Jamie BATNA; estimate value-to-client; rate price sensitivity (low/medium/high) with the evidence behind it; enumerate risks; conclude where leverage sits and why.
### Outputs
- `leverage-map.md` -> output/
### Verify
- Every conclusion traces to a specific dossier fact; no claim is unsupported. If a key input is missing, flag a loop-back to `01_intake` rather than inventing it.
### Review gate
- Jamie confirms the leverage read matches his gut before strategy is built on it.

## Notes
Value-to-client estimates are commercial judgement, not guaranteed outcomes — treat them as ranges, not promises.
