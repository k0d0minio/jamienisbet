# Iconography

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** Icon style rules so icons across websites and documents look like one set.

- **Library:** [Lucide](https://lucide.dev) — the default set; don't mix icon families. *(Chosen substitute — swap if a preferred set arrives.)*
- **Style:** line icons, 1.5–2px stroke, rounded caps/joins. Outline, not filled — matches the precise, unfussy brand line.
- **Sizing:** 15 / 18 / 21px (functional in buttons, nav, status rows, feature lists); align strokes to the pixel grid for crispness.
- **Colour:** `--text-3` at rest; `--primary` when an icon carries meaning (active nav, feature accent); status colours for status.
- **Delivery:** in production React apps use `lucide-react`. For static HTML / UMD surfaces (slides, email, social cards) use [`packages/ui/assets/lib/icons.js`](../../../packages/ui/assets/lib/icons.js) → `<Icon name="ArrowRight" size={18} />`, or `<i data-lucide="check"></i>` + `lucide.createIcons()`.
- **Don't:** emoji, multicolour/3D icons, mixing outline and filled, or scaling below 15px. Unicode arrows (`↗`) are fine inline in mono labels.
