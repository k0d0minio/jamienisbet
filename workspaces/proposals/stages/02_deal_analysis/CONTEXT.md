# 02 — Deal Analysis — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): [`../01_intake/output/`](../01_intake/) deal dossier
- Layer 3 (reference): pricing/value models in [`../../references/`](../../references/)

## Process
Derive client BATNA and Jamie BATNA; estimate value-to-client; rate price sensitivity (low/medium/high) with the evidence behind it; enumerate risks; conclude where leverage sits and why.

## Outputs
- `leverage-map.md` -> output/

## Integrations
- none

## Verify
- Every conclusion traces to a specific dossier fact; no claim is unsupported. If a key input is missing, flag a loop-back to `01_intake` rather than inventing it.

## Review gate
- Jamie confirms the leverage read matches his gut before strategy is built on it.
