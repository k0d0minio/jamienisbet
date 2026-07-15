# 01 — Intake — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): human input captured live; existing client record from the admin dashboard (Neon `biz.clients`)
- Layer 3 (reference): [`../../references/intake-checklist.md`](../../references/intake-checklist.md)

## Process
Agent prompts only for the fields needed to make a triage decision, fills them in real time, flags anything ambiguous, and keeps it brief. No evaluation happens here — capture only.

## Outputs
- `intake-<slug>.md` -> output/

## Integrations
- none

## Verify
- All required fields present (ask, scope, who, constraints); customer name reconciled against the `biz.clients` record; open questions explicitly listed so the assessment stage isn't guessing

## Review gate
- none
