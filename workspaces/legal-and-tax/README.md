# Legal & Tax Workspace

> **ICM role:** Layer 1 — router
> **Purpose:** Stand up Jamie's Portuguese legal business entity and keep taxes legally minimised through a sequential, reviewable, repeatable pipeline.

## What this folder accomplishes
This is the founder's #1 priority workspace. Jamie is a software engineer / AI consultant, Portuguese tax resident in Mafra, not yet registered. **The structure decision is made** — register as a self-employed *trabalhador independente* under the *regime simplificado* (full analysis: [`portugal-business-structure-analysis.md`](../../portugal-business-structure-analysis.md)). This pipeline **operates** that decision: confirming the situation still holds, recording the decision for the contabilista, producing the início-de-atividade action plan, surfacing the legal tax levers (above all the 0.75/0.35 coefficient question), and emitting a compliance calendar the tracker surfaces. It is configured once and re-run whenever a revisit trigger fires.

> **DISCLAIMER:** Everything produced here is **decision-support only**. It is not legal, tax, or accounting advice. Every output must be reviewed by a licensed Portuguese **contabilista certificado** and/or lawyer before action. Tax figures, thresholds, and legal conclusions are never asserted as fact here.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie's answers); [`_config/business/`](../../_config/business/) for entity facts, NIF/VAT, address, IBAN, rates; [`_config/business/founder-brief.md`](../../_config/business/founder-brief.md)
- **Downstream / feeds:** [`tracker/`](../../tracker/) (deadlines), [`workspaces/finance/`](../finance/) (regime, deductibles, invoicing structure), and updates back to [`_config/business/`](../../_config/business/) once the entity exists
- **Draws on (Layer 3 reference):** [`references/`](./references/), [`_config/conventions/`](../../_config/conventions/)

## Contents
- `setup/` — configure-once questionnaire defining this workspace's run parameters
- `stages/` — the numbered pipeline (01_discovery → 05_compliance_calendar)
- `references/` — stable PT tax/legal reference notes (Layer 3)
- `output/` — decisions, checklists, and calendars produced per run (Layer 4)

## How to run
1. Setup is already configured — see [`setup/output/config.md`](setup/output/config.md) (re-answer the questionnaire only if a revisit trigger fires).
2. Walk stages in order; each writes to its `output/` and stops at a human review gate.
3. Stage N's `output/` is stage N+1's input. Nothing advances unedited.

## Notes
One stage, one job. Plain markdown only — no hidden state. The structure decision is made and recorded (Stage 02); a contabilista confirms the **coefficient classification (0.75 vs 0.35)** and the filing. Re-open the decision only if a revisit trigger fires.
