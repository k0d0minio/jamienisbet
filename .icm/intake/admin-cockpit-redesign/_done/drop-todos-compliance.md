# Stub: Drop todos and compliance dates

- feature-slug: drop-todos-compliance
- scope: admin-cockpit-redesign
- personas: operator
- initiative: operator cockpit / objective: less time finding work, more time launching it
- depends-on: none
- sequence: 1 of 11
- complexity: medium
- recommended-model: sonnet

## Problem

Todos and compliance dates live in the admin, but Jamie keeps todos in Google Tasks and does not use either here. They add sections, sheets and queries that every later stub would have to carry.

## Proposed change

Remove todos and compliance dates from the product and the database. The Overdue section of the feed, the add-todo sheet on its title bar, the Todos card on a lead, the compliance calendar row and sheet, their server actions and their queries in `packages/services` all go. A migration drops `biz.tasks` and `biz.compliance_dates`. Nothing else on the feed changes yet.

The mockups are on the design canvas at https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC (sample data).

## Acceptance criteria (rough)

- [ ] The feed shows no Overdue section and no compliance row, and its title bar has no add-todo button.
- [ ] A lead profile shows no Todos card.
- [ ] `packages/services` exports no task or compliance query, and nothing in the repo imports one.
- [ ] A migration drops `biz.tasks` and `biz.compliance_dates`; it runs cleanly on a Neon branch.
- [ ] The feed's "N things waiting" count no longer counts todos or compliance dates.

## Out of scope (this feature)

- Any Google Tasks integration.
- Any other change to the feed — the Inbox is rebuilt in `inbox-rebuild`.

## Notes for Define

D-16. Open point from scope.md: whether the migration first exports the rows (a one-off CSV) or drops them as they are — ask Jamie. Load the `database-migration` capability skill. This stub goes first because it touches the schema and the migrations journal, which every later merge would otherwise conflict on.

touches: packages/services/src/schema/index.ts, packages/services/src/queries/tasks.ts, packages/services/src/queries/compliance.ts, packages/services/src/index.ts, packages/services/drizzle/**, websites/admin-dashboard/app/(app)/actions.ts, app/(app)/page.tsx, leads/[id]/page.tsx, leads/page.tsx, components/{overdue-list,add-todo,compliance-calendar,lead-todos}.tsx, websites/admin-dashboard/README.md

## Prompt

Read `.icm/intake/admin-cockpit-redesign/breakdown.md`, then this stub
(`.icm/intake/admin-cockpit-redesign/drop-todos-compliance.md`), then
`.icm/runs/admin-cockpit-redesign/01_scope/output/scope.md` for the decisions it cites.
Then run `/pipeline new drop-todos-compliance` — Define writes the spec on a `claude/` branch and a draft PR,
and marks this stub done.
