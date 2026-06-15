# Legal & Tax — Setup (Configure Once)

> **ICM role:** Layer 3 — reference
> **Purpose:** Capture the one-time configuration that parameterises every run of this workspace.

## What this folder accomplishes
"Configure the factory, not the product." Before any stage runs, Jamie answers a stable questionnaire describing the fixed shape of his situation: that he is tax-resident in Mafra, Portugal; that he provides software / AI-consulting services; his rough revenue band; whether clients are domestic (PT), EU, or non-EU; his risk appetite; and whether he prioritises take-home income, liability protection, or simplicity. This config is read by every stage so the pipeline does not re-ask fixed facts each run. It is edited rarely — only when a foundational circumstance changes.

> **DISCLAIMER:** Decision-support only. Answers here feed analysis that must be confirmed by a licensed Portuguese contabilista certificado / lawyer.

## How it connects to the architecture
- **Upstream / reads from:** human input; [`_config/business/`](../../../_config/business/) for any already-known legal facts
- **Downstream / feeds:** all stages in [`stages/`](../stages/), beginning with [`stages/01_discovery/`](../stages/01_discovery/)
- **Draws on (Layer 3 reference):** [`../references/`](../references/)

## Contents
- `questionnaire.md` — planned. The configure-once intake: residency, NIF status, income sources, client geography, revenue band, liability tolerance, growth plans, family/IRS context, existing contabilista (if any). Do NOT create yet.

## Notes
Keep this distinct from Stage 01 discovery: setup holds *stable* config (the factory settings); discovery holds *per-run* direction-setting. Personal/financial detail captured here is sensitive — reference, never restate, figures from [`_config/business/`](../../../_config/business/).
