# Stub: The desk tier: tokens and primitives

- feature-slug: desk-tier
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: none
- sequence: 2 of 11
- complexity: high
- recommended-model: opus

## Problem

The admin runs on the app tier, an iOS idiom built for a phone and stretched to the desk. Jamie wants a dense, flat work tool designed at the desk first. There is no design system for that yet.

## Proposed change

Add a **desk tier** to `packages/ui` beside the marketing tier, opt-in the way the app tier is today. Tokens: Hanken Grotesk UI text on a dense scale (title 22, heading 15, body 14, UI 13, meta 12 mono; one step up on touch), 32px desk rows and 44px touch rows, 30px desk controls and 44px on touch, 6–8px radii, hairline structure, no materials, no springs, a shadow only on what floats (palette, menu, sheet). Primitives: icon rail item with badge, pane and pane header, list row, status dot (next · open · running · blocked · done), priority tag, key hint (`kbd`), dense segmented control, data-grid row and header, command-palette shell, and the button sizes. Rewrite `packages/ui/BRAND.md` § App tier as § Desk tier and update the `design-dna` skill so every later session builds on it. The admin does not switch over in this stub.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] `@jamie-nisbet/ui` exports the desk-tier tokens and primitives, reached only through an opt-in stylesheet the admin will link.
- [ ] Every primitive renders in light and dark from semantic tokens only; no raw values at a call site.
- [ ] Controls and rows reach 44px on a touch pointer by construction, not by a rescue query.
- [ ] `BRAND.md` and `.claude/skills/design-dna/SKILL.md` describe the desk tier as the admin's tier and record D-1, D-3 and D-4 as scoped amendments.
- [ ] The portfolio and the sellers site render exactly as before.

## Out of scope (this feature)

- Switching any admin screen over — later stubs do that.
- Deleting the app tier — that is `retire-app-tier`.

## Notes for Define

D-1, D-3, D-4, D-22. The design-system sheet on the canvas ("Desk — the design system") is the reference for type, colour, status language and controls. Keep the brand ramp and semantic colours exactly; the tier adds density and structure, not new hues. Four designed states still apply.

touches: packages/ui/tokens/**, packages/ui/src/components/desk/** (new), packages/ui/src/index.ts, packages/ui/package.json (exports), packages/ui/BRAND.md, packages/ui/SKILL.md, .claude/skills/design-dna/SKILL.md

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/desk-tier.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Then run `/pipeline new desk-tier` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
