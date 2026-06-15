# Proposals — Setup (Configure the Factory)

> **ICM role:** Layer 3 — reference
> **Purpose:** Configure this workspace once so every later deal run reuses the same negotiation posture, pricing defaults, and review preferences.

## What this folder accomplishes
This is the "configure the factory, not the product" step (Principle 5). Before any deal flows through, Jamie answers a questionnaire that fixes the workspace defaults: his standard and stretch day rates, his minimum acceptable floor, which deal types he will and won't take, how aggressive an anchor he is comfortable with, and how he wants the negotiation coach to talk to him. Stages read these answers so each run starts from Jamie's real posture instead of generic assumptions. Configured rarely; read on every run.

## How it connects to the architecture
- **Upstream / reads from:** human input (Jamie's answers); [`_config/business/`](../../../_config/business/) (canonical rates, legal entity, founder-brief.md)
- **Downstream / feeds:** every stage in [`../stages/`](../stages/), especially `03_negotiation_strategy` (anchor aggressiveness, target vs floor) and `05_quote` (default rates)
- **Draws on (Layer 3 reference):** [`../references/`](../references/) (pricing models the defaults are expressed in); [`_config/conventions/`](../../../_config/conventions/) (how to build/configure a workspace)

## Contents
- `questionnaire.md` — planned: the one-time config interview (rates, floor, anchor appetite, deal types accepted/declined, coaching tone, default payment terms). Do not create yet; describe only.
- `output/` — planned: the saved, answered configuration that stages load at runtime.

## Notes
Keep this in sync with [`_config/business/`](../../../_config/business/): if the canonical rate card changes there, the answers here must be re-confirmed. Any rate, floor, or payment-term defaults stored here are commercial decision-support, not accounting advice — confirm tax/VAT treatment with a licensed Portuguese contabilista certificado before relying on a number in a real quote.
