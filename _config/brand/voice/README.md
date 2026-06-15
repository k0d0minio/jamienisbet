# Voice — Tone & Copy Rules

> **ICM role:** Layer 3 — reference
> **Purpose:** Define the personality behind every word — tone, messaging pillars, vocabulary, and a do/don't list — so all copy sounds like one person.

## What this folder accomplishes
This folder is the verbal counterpart to `visual/`. It captures how Jamie's business speaks: the tone of voice (expert but approachable, plain-spoken, no corporate fluff), the messaging pillars that every proposal and website page should reinforce, the preferred vocabulary (and banned words), and a concrete do/don't list. Because Jamie's leads come from networking and word of mouth, the written voice has to feel like a continuation of an in-person conversation — confident, honest, and specific. Every piece of client-facing copy, from a website hero line to an invoice note to a negotiation email, conforms to these rules.

## How it connects to the architecture
- **Upstream / reads from:** human input; founder personality in [`_config/business/founder-brief.md`](../../business/).
- **Downstream / feeds:** [`shared/templates/`](../../../shared/templates/) (proposal/quote/contract/work-order/invoice/email copy), [`websites/`](../../../websites/), and proposal/negotiation language used in [`workspaces/`](../../../workspaces/).
- **Draws on (Layer 3 reference):** [`_config/brand/visual/`](../visual/) so tone and visuals stay aligned.

## Contents
- `tone.md` — voice attributes, register, and examples (before/after rewrites).  *(planned — do not create)*
- `messaging-pillars.md` — the 3–5 core messages every deliverable reinforces.  *(planned)*
- `vocabulary.md` — preferred terms, product/service naming, words to avoid.  *(planned)*
- `do-dont.md` — concrete do/don't pairs for fast self-checking.  *(planned)*

## Notes
Voice rules are the recipe, not the content — no client-specific copy lives here. When a deliverable's wording is off-brand, fix the rule here (the "edit-source" principle) so the next run inherits the correction. Keep examples real and Portugal/freelancer-relevant rather than generic marketing-speak.
