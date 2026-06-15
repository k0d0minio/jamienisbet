# 03 — Delivery — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `02_build/output/`, `01_discovery/output/success-criteria.md`
- Layer 3 (reference): `shared/templates/`, `_config/brand/voice/`

## Process
Produce handoff package and instructions; verify each success criterion is met and signed off; record acceptance date and any caveats; write a retro (what worked, what to change). Signal `workspaces/finance/` that final invoicing can proceed.

## Outputs
- `handoff.md` -> output/
- `acceptance.md` -> output/  (sign-off + date)
- `retro.md` -> output/

## Integrations
- none

## Verify
- Every success criterion is checked off or has a documented, client-agreed exception.
- Acceptance is recorded before final-invoice handoff to `workspaces/finance/`.
- Client record in `shared/clients/<client>/` is updated with the outcome.

## Review gate
- Jamie confirms acceptance and the final-invoice trigger. Any payment terms or commercial wording is decision-support only and must be reviewed against `_config/business/` and, where it has legal/financial weight, by a licensed Portuguese contabilista certificado / lawyer before sending.
