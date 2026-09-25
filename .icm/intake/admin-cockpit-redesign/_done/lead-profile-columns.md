# Stub: The lead profile in two columns

- feature-slug: lead-profile-columns
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: shell-rail-palette, drop-todos-compliance
- sequence: 10 of 11
- complexity: medium
- recommended-model: sonnet

## Problem

The lead profile is a long stack of sections behind two tabs; at the desk most of the width is empty and the activity is a scroll away from the facts.

## Proposed change

Rebuild `/leads/<id>` in the desk tier. Head: monogram, name, company · status · deal stage · tier, the deal figure in mono, and an action bar — call, WhatsApp, email, log a touch, touched today, write a draft, start work — with archive, opt-out and delete behind a menu. At the desk, two columns: left, the next step (red when late), then Contact, Facts, Deal and Deal folder as dense key–value lists with their edit sheets, and "how they came in" folded; right, tabs Activity (the touch timeline, status changes), Draft, Forms and Notes. j/k steps to the next and previous lead. On the phone it stacks, next step first.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] At the desk the profile shows facts on the left and activity on the right with no Person / Work tabs.
- [ ] Every edit, action and sheet that exists today still works.
- [ ] The next step reads first on both layouts and goes red when late.
- [ ] Destructive actions are behind a menu, never in the thumb zone.
- [ ] j/k moves between leads in the list's current order.

## Out of scope (this feature)

- Todos (removed in `drop-todos-compliance`).
- Any change to drafting, reply triage or enrichment behaviour.

## Notes for Define

D-20, D-16. Fix the stale copy the inventory found on the way: the answered-form text that says the deal folder is set in the Deal card.

touches: websites/admin-dashboard/app/(app)/leads/[id]/page.tsx, components/lead-*.tsx, components/client-*.tsx, components/form-links.tsx, components/next-step-pane.tsx

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/lead-profile-columns.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that shell-rail-palette, drop-todos-compliance is merged to `main` first.
Then run `/pipeline new lead-profile-columns` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
