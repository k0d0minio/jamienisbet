# Colors

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** The palette — hex values, semantic roles, and contrast rules. Machine-readable values live in [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css) (canonical: [`packages/ui/tokens/colors.css`](../../../packages/ui/tokens/colors.css)); this is the human explainer.

Direction: calm, minimal, Swiss — **one disciplined slate-blue**, cool-grey neutrals, restrained (never neon) status colours, and lots of white space. The restrained answer to a louder Majorelle. **Confirmed (2026-06-15).** Every site and document reads from the tokens, so a change here propagates everywhere.

**Always design against the semantic aliases** (`--surface`, `--text-1`, `--border`, `--primary`), not the raw ramps below. The aliases flip correctly between light and dark via `[data-theme="dark"]`.

## Primary — slate blue (ramp `--blue-*`)
`--blue-600 #3A5A78` is the brand base. Ramp: `50 #F2F6FA · 100 #E3EBF3 · 200 #C6D6E5 · 300 #9DB6CF · 400 #6E90B2 · 500 #4A6E94 · 600 #3A5A78 ★ · 700 #2F4A63 · 800 #283D51 · 900 #1E2E3D · 950 #141F2A`.

## Neutrals — cool grey (ramp `--neutral-*`)
Never pure black; text tops out at `--neutral-900 #15181C`. Ramp: `0 #FFFFFF · 50 #F7F8F9 · 100 #EFF1F3 · 200 #E2E5E9 · 300 #CBD0D6 · 400 #9AA2AC · 500 #6B747F · 600 #4C545D · 700 #383E45 · 800 #24282D · 900 #15181C · 950 #0C0E11`.

## Status — muted accents
| Token | Hex | Role |
|---|---|---|
| `--success` / `--green-500` | `#2E7D5B` | paid, won, positive |
| `--warning` / `--amber-500` | `#B7791F` | due soon, attention |
| `--danger` / `--red-500` | `#C0453B` | overdue, lost, error |

Each has a soft tint (`--success-soft`, etc.) for backgrounds.

## Semantic aliases (light → dark flips automatically)
| Alias | Light | Role |
|---|---|---|
| `--bg` | `neutral-50` | page background |
| `--surface` | `neutral-0` | cards, panels |
| `--surface-sunken` | `neutral-100` | wells, inset fields |
| `--text-1` | `neutral-900` | primary text |
| `--text-2` | `neutral-600` | secondary text |
| `--text-3` | `neutral-500` | muted / meta / mono eyebrow |
| `--border` | `neutral-200` | hairline (does most structural work) |
| `--border-strong` | `neutral-300` | control borders |
| `--primary` | `blue-600` | links, primary buttons, active state |
| `--primary-hover` / `--primary-active` | `blue-700` / `blue-800` | hover / press (colour deepens) |
| `--primary-fg` | `neutral-0` | text on primary fill |

In dark, `--primary` lightens to `--blue-400` and surfaces go to near-black slate. See [`packages/ui/tokens/colors.css`](../../../packages/ui/tokens/colors.css) for the full dark block.

## Contrast rules (WCAG AA)
- `--text-1` and `--primary` on `--surface` pass AA for body text; use `--text-1` for long text.
- Status colours are for fills + meaningful icons/text on their soft tint, not low-contrast body text on white.
- Buttons: primary = `--primary-fg` on `--primary`; secondary = `--text-1` on `--surface` with a `--border-strong` outline.
- Check any new pairing reaches 4.5:1 for normal text, 3:1 for large/UI text.
