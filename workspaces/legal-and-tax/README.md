# Legal & Tax Workspace

> **ICM role:** Layer 1 — router
> **Purpose:** Stand up Jamie's Portuguese legal business entity and keep taxes legally minimised through a sequential, reviewable, repeatable pipeline.

## What this folder accomplishes
This is the founder's #1 priority workspace. Jamie is a software engineer / AI consultant resident in Mafra, Portugal, with no legal entity registered yet. This pipeline takes him from "no entity" to "registered, compliant, and tax-optimised": discovering his situation, comparing Portuguese structures (ENI vs Lda., simplified vs organised accounting), executing the registration with Finanças and Segurança Social, setting up ongoing legal tax optimisation, and emitting a compliance calendar that downstream systems track. It is configured once and re-run whenever circumstances change (new income source, crossing a turnover threshold, regime review).

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
1. Fill `setup/questionnaire.md` once.
2. Walk stages in order; each writes to its `output/` and stops at a human review gate.
3. Stage N's `output/` is stage N+1's input. Nothing advances unedited.

## Notes
One stage, one job. Plain markdown only — no hidden state. The entity decision (Stage 02) is a trade-off presentation, never a single prescribed answer; a contabilista confirms the final choice.
