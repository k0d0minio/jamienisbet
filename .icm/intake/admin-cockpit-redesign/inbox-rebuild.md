# Stub: The Inbox as a fast queue

- feature-slug: inbox-rebuild
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: shell-rail-palette, drop-todos-compliance
- sequence: 7 of 11
- complexity: medium
- recommended-model: sonnet

## Problem

Jamie rarely opens Needs you: it holds the wrong things, is slow to act on and hard to scan, and it is not where the day starts.

## Proposed change

Rebuild `/inbox` in the desk tier as a queue in groups. This stub builds the frame and the **Follow-ups** group: outreach due, open leads untouched 7+ days, and nurture wakes. The Money section, Today's tickets and the "worth a look" counts leave the Inbox. At the desk: a dense list (kind tag in mono, title, who or where, age) and a detail pane with the facts and the actions — WhatsApp, call, email, log a touch, mark touched, wake, later +90 days, move the next step to tomorrow. On the phone: the same groups, a row opens in place with its two main actions. Keyboard: j/k, enter for the main action, `e` done, `s` tomorrow. A cleared row leaves the list; an empty Inbox says nothing needs you.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] The Inbox shows Follow-ups only (Gates and PRs arrive in `gates-read`), each group foldable with its count.
- [ ] Money rows, today's tickets and the "worth a look" counts no longer appear; the counts stay reachable as Leads filters.
- [ ] Every follow-up can be cleared from the Inbox without opening the lead: touched, wake, later, or next step moved to tomorrow.
- [ ] Nothing is sent from the Inbox: drafts open in WhatsApp or Mail, and a touch is logged by hand.
- [ ] The rail and tab-bar badge equals the number of rows.
- [ ] j/k, enter, `e` and `s` work at the desk; the phone layout works one-handed.

## Out of scope (this feature)

- The gates data — `gates-read`.
- Any change to how outreach is due or when a lead is stale.

## Notes for Define

D-13, D-15, D-17, D-18. The standing rule holds: no outbound action without review.

touches: websites/admin-dashboard/app/(app)/inbox/**, components/swipe-row.tsx, components/touch-row.tsx, components/nurture-wakes.tsx, components/inbox-*.tsx (new), app/(app)/actions.ts (a "next step to tomorrow" action)

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/inbox-rebuild.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Check that shell-rail-palette, drop-todos-compliance is merged to `main` first.
Then run `/pipeline new inbox-rebuild` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
