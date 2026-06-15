# Visual Identity — Design Tokens

> **ICM role:** Layer 3 — reference
> **Purpose:** The machine- and human-readable design system (color, type, logo rules, spacing, icons) that websites and document templates consume.

## What this folder accomplishes
This folder defines the visual language of Jamie's business as a set of stable tokens: the color palette (with hex/RGB values and usage roles), typography (typefaces, weights, type scale), logo usage rules (clear space, minimum size, what not to do), spacing and layout tokens, and iconography style. These are the values that `websites/` reads for its CSS/theme and that `shared/templates/` reads to style proposals, quotes, contracts, and invoices. Defining them once here is what guarantees the website and a PDF invoice feel like the same company.

## How it connects to the architecture
- **Upstream / reads from:** human input; brand direction from [`_config/business/founder-brief.md`](../../business/).
- **Downstream / feeds:** [`websites/`](../../../websites/) theming; [`shared/templates/`](../../../shared/templates/) document styling; [`_config/brand/assets/`](../assets/) (assets are exported to match these tokens).
- **Draws on (Layer 3 reference):** [`_config/brand/voice/`](../voice/) for the personality the visuals must express.

## Contents
- `colors.md` — palette with hex/RGB values, semantic roles (primary, accent, neutral, success, warning), and contrast notes.  *(planned — do not create)*
- `typography.md` — typefaces, weights, type scale, line-height, web + print fallbacks.  *(planned)*
- `logo.md` — logo variants, clear space, minimum size, misuse examples.  *(planned)*
- `tokens.md` — spacing scale, radii, shadows, breakpoints as named design tokens.  *(planned)*
- `iconography.md` — icon style, stroke weight, sizing rules.  *(planned)*

## Notes
Keep tokens named and semantic (e.g. `color-primary`, `space-4`) so both Claude and humans can reference them unambiguously across web and print. Treat these files as the contract: when a value changes here, re-export the affected files in [`assets/`](../assets/) and re-run any website/template stage that consumes them.
