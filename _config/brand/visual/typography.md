# Typography

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** Typefaces, scale, and weights. Machine-readable values in [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css).

## Typefaces
- **Sans (UI, body, headings): Inter.** Humanist, clean, friendly, excellent on screen, open-source.
  Web fallback: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Mono (code, data): JetBrains Mono.** Fallback: `ui-monospace, "SF Mono", Menlo, monospace`.
- One family for headings and body keeps a solo brand cohesive. An optional warm serif (e.g. *Fraunces*) may be added later for marketing headlines — note it here if adopted.

## Type scale (1.250 / major-third, base 16px)
| Token | Size | Use |
|---|---|---|
| `font-size-xs` | 12.8px | captions, labels |
| `font-size-sm` | 14px | secondary text |
| `font-size-base` | 16px | body |
| `font-size-md` | 20px | lead paragraph, large UI |
| `font-size-lg` | 25px | h3 |
| `font-size-xl` | 31px | h2 |
| `font-size-2xl` | 39px | h1 |
| `font-size-3xl` | 49px | hero |

## Weights & spacing
- Weights: `400` body, `500` UI/medium, `600` semibold (subheads), `700` headings.
- Line-height: `1.6` body, `1.2` headings.
- Headings: weight 700, tracking slightly tight (−0.01em). Body: normal tracking.
- Print (documents): same scale; keep legal body text ≥ 11px.
