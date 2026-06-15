# Visual Identity — Design Tokens

> **ICM role:** Layer 3 — reference
> **Purpose:** The machine- and human-readable design system (color, type, logo rules, spacing, icons) that websites and document templates consume.

## What this folder accomplishes
This folder defines the visual language of Jamie's business as a set of stable tokens: the color palette (with hex/RGB values and usage roles), typography (typefaces, weights, type scale), logo usage rules (clear space, minimum size, what not to do), spacing and layout tokens, and iconography style. These are the values that `websites/` reads for its CSS/theme and that `shared/templates/` reads to style proposals, quotes, contracts, and invoices. Defining them once here is what guarantees the website and a PDF invoice feel like the same company.

## How it connects to the architecture
- **Upstream / reads from:** human input; brand direction from [`_config/business/founder-brief.md`](../../business/).
- **Downstream / feeds:** [`websites/`](../../../websites/) theming; [`shared/templates/`](../../../shared/templates/) document styling; [`_config/brand/assets/`](../assets/) (assets are exported to match these tokens).
- **Draws on (Layer 3 reference):** [`_config/brand/voice/`](../voice/) for the personality the visuals must express.

## Canonical implementation
The **live tokens, brand assets, and reusable components** ship from the shared UI package [`packages/ui/`](../../../packages/ui/) — websites consume them via `@jamie-nisbet/ui` and `@jamie-nisbet/ui/styles.css`. The files here are the **human-readable brand contract**; [`tokens.css`](tokens.css) re-exports the package so non-package consumers (document templates, one-off HTML) can link one stylesheet. Change the package tokens and these docs together.

## Contents
- [`colors.md`](colors.md) — palette: slate-blue ramp, cool-grey neutrals, semantic aliases, contrast rules.
- [`typography.md`](typography.md) — typefaces (Hanken Grotesk / IBM Plex Mono), type scale, weights.
- [`tokens.md`](tokens.md) — spacing, radii, shadows, motion, layout tokens.
- [`logo.md`](logo.md) — the wordmark + JN monogram and usage rules (locked 2026-06-15).
- [`iconography.md`](iconography.md) — icon style rules (Lucide, line, 1.5–2px).
- [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css) — **machine-readable** tokens mirroring `packages/ui`.

## Notes
Keep tokens named and semantic (e.g. `--primary`, `--surface`, `--space-5`) and design against the semantic aliases, never the raw ramps. Light is default; dark flips via `[data-theme="dark"]`. Treat these files as the contract: when a value changes, update [`packages/ui/tokens/`](../../../packages/ui/tokens/) and these docs together, then re-run any website/template stage that consumes them.
