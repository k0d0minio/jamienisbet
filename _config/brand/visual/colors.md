# Colors

> **ICM role:** Layer 3 — reference (brand visual)
> **Purpose:** The palette — hex values, semantic roles, and contrast rules. Machine-readable values live in [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css); this is the human explainer.

Direction: trustworthy + expert (deep teal-blue) warmed by a friendly, approachable amber, on clean neutrals with lots of white space. **Confirmed (2026-06-15).** Every site and document reads from the tokens, so a change here propagates everywhere.

## Core
| Token | Hex | Role |
|---|---|---|
| `color-ink` | `#16202C` | primary text on light surfaces |
| `color-primary` | `#1B5A78` | brand blue — headings accents, links, primary buttons (trust/expertise) |
| `color-primary-strong` | `#103E54` | hover / pressed / emphasis |
| `color-accent` | `#E8A23D` | warm amber — highlights, calls-to-action, small fills (friendly) |
| `color-accent-strong` | `#C9871F` | accent hover / pressed |

## Neutrals & surfaces
| Token | Hex | Role |
|---|---|---|
| `color-surface` | `#FFFFFF` | page background |
| `color-surface-muted` | `#F5F7F9` | cards, alternating sections |
| `color-border` | `#E2E8EE` | hairlines, dividers, input borders |
| `color-muted` | `#5C6B7A` | secondary text, captions |

## Status
| Token | Hex | Role |
|---|---|---|
| `color-success` | `#2E7D5B` | paid, won, positive |
| `color-warning` | `#C9871F` | due soon, attention |
| `color-danger` | `#C0492F` | overdue, lost, error |

## Contrast rules (WCAG AA)
- `color-ink` and `color-primary` on white pass AA for body text; use `color-ink` for long text.
- **`color-accent` (amber) is for fills/highlights, NOT text on white** (too low contrast). Text on an amber fill should be `color-ink`.
- Buttons: primary = white text on `color-primary`; secondary = `color-primary` text on white with a `color-border` outline.
- Check any new pairing reaches 4.5:1 for normal text, 3:1 for large/UI text.
