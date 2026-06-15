# Knowledge — Reusable Playbooks & Boilerplate

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the reusable playbooks, snippets, FAQs, case studies, and boilerplate the agent reaches for across many workspaces, so hard-won knowledge is written down once and reused everywhere.

## What this folder accomplishes
This is Jamie's institutional memory in plain markdown. It collects the things that are true across deals rather than specific to one: how to run a discovery call, standard answers to the questions prospects always ask, reusable boilerplate (about-me blurb, standard terms, service descriptions), and write-ups of past projects that double as social proof. Because lead generation is networking and word of mouth, well-told case studies and crisp FAQ answers are genuine sales assets. The agent loads only the snippet a stage needs (layered context loading) rather than re-deriving it each run, which keeps proposals, websites, and outreach consistent and fast.

## How it connects to the architecture
- **Upstream / reads from:** human input (lessons learned, finished projects); `projects/<client-or-project>/` outputs that get distilled into case studies.
- **Downstream / feeds:** `shared/templates/` (reusable copy blocks), `workspaces/proposals/`, `workspaces/lead-generation/`, and `websites/` (portfolio, about, case-study pages).
- **Draws on (Layer 3 reference):** `_config/brand/voice/` so every snippet matches Jamie's tone; `_config/business/` for accurate service and rate framing.

## Contents
- `case-studies/` — planned: one write-up per shipped project (problem, approach, result), reusable as portfolio and proof.
- `faqs.md` — planned: standard answers to recurring prospect questions.
- `snippets/` — planned: reusable copy blocks (bio, service blurbs, standard terms).
- `playbooks/` — planned: repeatable processes (discovery call, scoping, the local-referral 10% landing-page program).

## Notes
Keep entries broadly reusable. A playbook that is tightly scoped to a single pipeline — for example the proposal negotiation-tactics library — belongs in that workspace's own `references/` (e.g. `workspaces/proposals/references/`), not here; promote something to `shared/knowledge/` only once a second pipeline needs it. Case studies must be cleared with the client and anonymised where required before reuse. Any content touching tax, legal, or financial advice is decision-support only and must be reviewed by a licensed Portuguese contabilista certificado / lawyer before relying on it.
