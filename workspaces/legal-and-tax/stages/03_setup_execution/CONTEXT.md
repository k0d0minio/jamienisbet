# 03 — Setup Execution — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `../02_entity_options/output/recommended-direction.md` (contabilista-confirmed)
- Layer 3 (reference): `../../references/`

## Process
Generate an ordered checklist (Finanças → CAE → Segurança Social → bank → IVA), each step with owner, portal/location, prerequisites, and a confirm-with-contabilista flag.

## Outputs
- `registration-checklist.md` -> output/
- `entity-facts-to-record.md` -> output/  (handoff back to `_config/business/`)

## Integrations
- none

## Verify
- Steps are correctly ordered (dependencies respected); CAE and IVA choices match Stage 02; every official step names the portal and notes contabilista sign-off.

## Review gate
- none
