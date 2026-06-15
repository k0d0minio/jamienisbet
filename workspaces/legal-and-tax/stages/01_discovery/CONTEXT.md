# 01 — Discovery — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): human answers; `../../setup/questionnaire.md`
- Layer 3 (reference): `../../references/`

## Process
Agent asks question-by-question, never assuming. Captures income geography, revenue band, risk appetite, and goals. Flags open questions for the contabilista.

## Outputs
- `situation-brief.md` -> output/

## Integrations
- none

## Verify
- Every config field from setup is reflected; client-geography and revenue band are explicit (they drive VAT and regime choice); unknowns are listed, not guessed.

## Review gate
- none
