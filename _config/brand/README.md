# Brand — Single Source of Truth (Visual + Verbal Identity)

> **ICM role:** Layer 3 — reference
> **Purpose:** Define one identity — how the business looks and how it sounds — so the website and every official document share the same look and voice.

## What this folder accomplishes
This is where Jamie's brand is decided once and reused everywhere. The founder explicitly wants the website and all official copy — proposals, quotes, contracts, work orders, invoices — to share ONE visual identity, and this folder makes that possible. It splits the brand into three stable references: the visual system (color, type, logo, tokens), the verbal system (tone, vocabulary, messaging), and the exported production files. Any pixel or phrase that represents the business to a client traces back to here.

## How it connects to the architecture
- **Upstream / reads from:** human input; [`_config/business/founder-brief.md`](../business/) for positioning and personality.
- **Downstream / feeds:** [`websites/`](../../websites/), [`shared/templates/`](../../shared/templates/) (letterhead, document styling, copy), and any client-facing artifact produced in [`workspaces/`](../../workspaces/) and [`projects/`](../../projects/).
- **Draws on (Layer 3 reference):** business identity facts in [`_config/business/`](../business/).

## Contents
- `visual/` — color palette, typography, logo usage, spacing/design tokens, iconography. See [`visual/`](visual/).
- `voice/` — tone of voice, messaging pillars, vocabulary, do/don't list. See [`voice/`](voice/).
- `assets/` — exported production files: logos (svg/png), favicons, social avatars, document letterhead. See [`assets/`](assets/).

## Notes
Visual and voice are the *spec*; assets are the *rendered output* of that spec — if a token changes in `visual/`, the files in `assets/` must be re-exported to match. Keep this brand consistent for a freelancer/consultant audience reached through networking and word of mouth: trustworthy, expert, approachable. No per-client overrides live here; one identity serves all.
