# Typography

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** Typefaces, scale, and weights. Machine-readable values in [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css) (canonical: [`packages/ui/tokens/typography.css`](../../../packages/ui/tokens/typography.css)).

## Typefaces

- **Sans (UI, body, headings): Hanken Grotesk.** A neutral grotesque — quiet, Swiss, excellent for both display and body. Weights 300–800; headings sit at 600.
  Fallback: `'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- **Mono (the engineer's signature): IBM Plex Mono.** Used for eyebrows/labels, metadata, figures, code, and table data — the signal of the engineer behind the work.
  Fallback: `'IBM Plex Mono', ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace`.
- **Delivery:** Google Fonts CDN today (see [`packages/ui/tokens/fonts.css`](../../../packages/ui/tokens/fonts.css)). To self-host, drop woff2 files in `packages/ui/assets/fonts/` and swap the `@import` for local `@font-face` rules.

Hierarchy comes from **weight + size + tight tracking**, not decoration.

## Type scale (1.250 major-third, base 16px)

| Token | Size | Use |
|---|---|---|
| `--text-2xs` | 11px | micro / mono eyebrow labels |
| `--text-xs` | 12px | captions, mono meta |
| `--text-sm` | 14px | secondary text, UI |
| `--text-md` | 16px | body |
| `--text-lg` | 18px | lead paragraph |
| `--text-xl` | 22px | h3 / card title |
| `--text-2xl` | 28px | h2 |
| `--text-3xl` | 36px | h1 / section title |
| `--text-4xl` | 48px | large display |
| `--text-5xl` | 60px | display |
| `--text-6xl` | 76px | hero display |

## Weights, leading & tracking

- Weights: `300` light, `400` body, `500` UI/medium, `600` semibold (headings), `700` bold, `800` extra.
- Line-height: `1.5–1.65` body (`--leading-normal` / `--leading-relaxed`), `1.1` headings (`--leading-tight`).
- Tracking: `-0.02` to `-0.03em` on display sizes (`--tracking-tight`); `0.12em` uppercase on mono eyebrow labels (`--tracking-caps`).
- **Casing:** sentence case everywhere. The *only* uppercase is the mono eyebrow/label (e.g. `SELECTED WORK`), always wide-tracked. Never Title Case headings.
- Print (documents): same scale; keep legal body text ≥ 11px.
