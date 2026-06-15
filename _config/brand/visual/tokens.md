# Design Tokens (spacing, radii, shadow, motion, layout)

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** The non-color, non-type tokens. Machine-readable values in [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css); canonical implementation in [`packages/ui/tokens/`](../../../packages/ui/tokens/). This is the explainer.

## Spacing (4px base, used generously — whitespace is the brand)

`space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 24 · `space-6` 32 · `space-7` 48 · `space-8` 64 · `space-9` 96 · `space-10` 128. Compose layouts from these; avoid arbitrary pixel values. Sections breathe at `--section-y` (96px).

## Radii (tight, precise — engineering restraint)

`radius-xs` 3px · `radius-sm` 5px (`--radius-control`: buttons, inputs) · `radius-md` 8px · `radius-lg` 12px (`--radius-card`) · `radius-xl` 16px · `radius-2xl` 24px (large panels) · `radius-full` 999px (pills).

## Shadows (soft, low — hairline borders do most of the work)

`shadow-xs` → `shadow-xl`, soft and low. A card's resting state is usually *just a 1px `--border`*; shadow appears mainly on hover (`shadow-md` + 2px lift) and on overlays/dialogs (`shadow-xl`). Dark theme has its own deeper shadow values.

## Motion (quick, confident, no bounce)

- Easing: `--ease-out` `cubic-bezier(0.2,0,0,1)`. **No spring, no bounce.**
- Duration: `--duration-fast` 120ms · `--duration-base` 180ms · `--duration-slow` 260ms.
- Transitions are fades + small (2px) translations. Hover = subtle background/border shift or a small lift; **press = colour deepens** (`--primary-active`), never a shrink. Respects `prefers-reduced-motion`.

## Layout

- Content max-widths: `container-sm` 640 (prose) · `container-md` 840 · `container-lg` 1080 (marketing) · `container-xl` 1280.
- Breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

## Texture

The single permitted texture is the **blueprint grid** (`.dst-grid-bg`, 32px, ~5% opacity) behind heroes and dark covers — structural, never over body text. No decorative gradients.

## Naming

Tokens are semantic and stable (`space-4`, `radius-card`, `--surface`). Reference them by name in CSS and document templates — never hard-code a raw value, so a single change propagates everywhere.
