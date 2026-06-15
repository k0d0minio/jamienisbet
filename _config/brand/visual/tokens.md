# Design Tokens (spacing, radii, shadow, layout)

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** The non-color, non-type tokens. Machine-readable values in [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css); this is the explainer.

## Spacing (4px base)
`space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 24 · `space-6` 32 · `space-7` 48 · `space-8` 64. Compose layouts from these; avoid arbitrary pixel values.

## Radii
`radius-sm` 6px (inputs, chips) · `radius-md` 10px (cards, buttons) · `radius-lg` 16px (panels) · `radius-pill` 999px (tags).

## Shadows
- `shadow-sm` — `0 1px 2px rgba(22,32,44,.06)` (subtle lift, inputs).
- `shadow-md` — `0 4px 12px rgba(22,32,44,.08)` (cards, popovers).
Keep shadows soft and low — the brand is clean, not heavy.

## Layout
- Content max-width `1120px`; comfortable reading column `680px`.
- Breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

## Naming
Tokens are semantic and stable (`space-4`, `radius-md`). Reference them by name in CSS and in document templates — never hard-code a raw value, so a single change here updates everything.
