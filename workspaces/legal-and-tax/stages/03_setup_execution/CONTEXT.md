# 03 — Setup Execution (Início de Atividade Plan) — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `../02_entity_options/output/` (the decision record)
- Layer 3 (reference): `../../references/accounting-regimes.md`, `../../references/iva-vat-notes.md`, `../../references/social-security-notes.md`; `../../references/portugal-business-structure-analysis.md` §7

## Process
Produce the ordered início-de-atividade plan: regime simplificado selection; activity/CIRS code (flag the 0.75/0.35 decision for the contabilista); a start date chosen to maximise the year-1 SS exemption + reduced-coefficient window; VIES registration; foreign-client invoice wording (reverse-charge / out-of-scope). Mark who does each step (Jamie vs contabilista) and where.

## Outputs
- `setup-action-plan.md` -> output/

## Integrations
- none (filing is done by Jamie/contabilista on the Portal; the agent never files)

## Verify
- Every step traces to the decided structure; the coefficient is flagged for the contabilista, not chosen blind; the start date is justified against the startup-benefit windows.

## Review gate
- MANDATORY contabilista review before anything is filed.
