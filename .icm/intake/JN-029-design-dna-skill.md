# JN-029 · Design DNA skill — every session designs on brand

| | |
|---|---|
| Status | in-progress |
| Type | chore |
| Priority | P1 |
| Size | S |

## Problem

Design quality currently depends on whoever (human or Claude session) happens to reread
`packages/ui/BRAND.md` before touching UI. Most sessions don't, so screens accrete
default-shadcn flatness: no empty/loading/error states, mouse-sized targets, light-only
thinking, decoration instead of hierarchy. The brand document is good; it just isn't
*loaded* when the work happens.

## Build

A repo-local Claude Code skill at `.claude/skills/design-dna/SKILL.md` that auto-triggers
on any UI work in this repo (frontmatter `description` written so it fires on component,
screen, styling and layout tasks). It distills — not duplicates — `BRAND.md` into an
actionable checklist a session applies on every turn:

- The one-paragraph brand stance (Swiss-minimal, one slate blue, hairline borders,
  mono figures, sentence case, no emoji, no gradients, quiet ≠ flat).
- **Always design against semantic tokens** (`--surface`, `--text-1`, `--border`,
  `--primary`) so light/dark both work; never hex, never Tailwind palette colours.
- **Every view ships four states**: content, empty (designed, not blank), loading
  (skeleton, not spinner-only), error (recoverable, plain words).
- **Mobile is the primary surface** for the admin: 44px targets, thumb-zone placement,
  bottom sheets not centred dialogs, nothing hover-only.
- **Motion rules**: 120–260ms ease-out from `tokens/motion.css`, fades and 2px
  translations, press = colour deepens, respect `prefers-reduced-motion`.
- Pointers to the source of truth (`packages/ui/BRAND.md`, `tokens/`, existing
  components) rather than restating them.

Keep the skill under ~150 lines so it loads cheap. Mention it from `CLAUDE.md`'s routing
table (brand row) so humans find it too.

## Acceptance

- [ ] `.claude/skills/design-dna/SKILL.md` exists, triggers on UI-touching prompts
- [ ] Checklist covers tokens, four states, touch/mobile, motion, voice
- [ ] No token values duplicated — points at `packages/ui` for specifics
- [ ] CI green

## Prompt

Create a repo-local Claude Code skill that makes every session apply the Jamie Nisbet
design system when touching UI. Read .icm/intake/JN-029-design-dna-skill.md for full
context and packages/ui/BRAND.md for the source material. The skill lives at
.claude/skills/design-dna/SKILL.md and distills BRAND.md into an actionable per-turn
checklist (semantic tokens only, four view states, mobile-first targets, motion rules)
without duplicating token values. Open a PR on a claude/ branch; do not run local checks —
CI is the source of truth.
