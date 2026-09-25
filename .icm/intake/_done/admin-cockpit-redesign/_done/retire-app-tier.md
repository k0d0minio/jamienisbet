# Stub: Retire the app tier and finish the sweep

- feature-slug: retire-app-tier
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: work-phone, gates-read, leads-table-board, lead-profile-columns
- sequence: 11 of 11
- complexity: medium
- recommended-model: sonnet

## Problem

Once every screen is on the desk tier, the app tier's tokens and components are dead weight, and the screens outside the main four still wear it.

## Proposed change

Move what is left — login, not-found, error and loading screens, pull-to-refresh, toasts, the PWA shell — onto the desk tier, then delete the app tier from `packages/ui` (tokens, `app.css`, the components under `src/components/app/`) and its sections from `BRAND.md` and the `design-dna` skill. Audit the admin in both themes, at desk and phone widths, for raw values, hover-only affordances and targets under 44px on touch.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] No file in the repo imports an app-tier component or `app.css`, and they no longer exist.
- [ ] Login, not-found, error and loading states are on the desk tier.
- [ ] `BRAND.md` and `design-dna` describe two tiers: marketing and desk.
- [ ] Both themes pass a visual check at desk and phone widths.

## Out of scope (this feature)

- Reviving Money.

## Notes for Define

D-1, D-17, D-22. Open point from scope.md: the dormant Money page uses the app tier — port it mechanically to the desk tier, or keep only the app-tier pieces it imports and say so in BRAND.md.

touches: packages/ui/tokens/app.css, packages/ui/app.css, packages/ui/src/components/app/**, packages/ui/src/index.ts, packages/ui/BRAND.md, .claude/skills/design-dna/SKILL.md, websites/admin-dashboard/app/login/**, app/not-found.tsx, app/(app)/*/loading.tsx, app/(app)/*/error.tsx, components/pull-to-refresh.tsx, app/(app)/money/** (only if ported)

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/retire-app-tier.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that work-phone, gates-read, leads-table-board, lead-profile-columns is merged to `main` first.
Then run `/pipeline new retire-app-tier` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
