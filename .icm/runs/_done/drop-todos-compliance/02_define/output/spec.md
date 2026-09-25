# Spec: Drop todos and compliance dates

- slug: drop-todos-compliance
- personas: operator
- touches: packages/services/src/schema/index.ts, packages/services/src/queries/tasks.ts, packages/services/src/queries/compliance.ts, packages/services/src/index.ts, packages/services/drizzle, packages/services/README.md, websites/admin-dashboard/app/(app)/actions.ts, websites/admin-dashboard/app/(app)/page.tsx, websites/admin-dashboard/app/(app)/leads/[id]/page.tsx, websites/admin-dashboard/app/(app)/leads/page.tsx, websites/admin-dashboard/components/overdue-list.tsx, websites/admin-dashboard/components/add-todo.tsx, websites/admin-dashboard/components/compliance-calendar.tsx, websites/admin-dashboard/components/lead-todos.tsx, websites/admin-dashboard/README.md, AGENTS.md
- complexity: standard

## Problem

The admin carries todos (`biz.tasks`) and Portuguese compliance dates (`biz.compliance_dates`):
an Overdue section and a compliance calendar on the *Needs you* feed, an add-todo sheet on the
feed's title bar, a Todos card on every lead profile, and their server actions and queries.
Jamie keeps todos in Google Tasks and uses neither here [D-16], so they are dead weight that every
later stub of the cockpit redesign would have to carry and merge around. It advances the operator
cockpit initiative — less time finding work, more time launching it — by clearing the feed and the
schema before the redesign builds on them. It goes first in the batch because it is the one stub
that changes the schema and the migrations journal.

## Proposed change

Todos and compliance dates leave the product and the database entirely [D-16].

- **Feed (`/`)** — the Overdue section, the compliance calendar row/sheet and the add-todo `+` on
  the title bar are removed. The "N things waiting on you" count no longer adds todos or
  compliance dates. Every other feed section, its order and its data are unchanged (the Inbox is
  rebuilt later, in `inbox-rebuild`).
- **Lead profile (`/leads/<id>`)** — the Todos card is removed; nothing takes its place.
- **Server actions** — every todo and compliance action in `app/(app)/actions.ts` is deleted,
  along with any revalidation path that existed only for them.
- **Components** — `overdue-list.tsx`, `add-todo.tsx`, `compliance-calendar.tsx` and
  `lead-todos.tsx` are deleted.
- **`packages/services`** — `queries/tasks.ts` and `queries/compliance.ts` are deleted, their
  re-exports leave `src/index.ts`, and the `tasks` and `complianceDates` tables (and any
  types/constants such as the compliance recurrences that exist only for them) leave
  `src/schema/index.ts`.
- **Migration** — one Drizzle migration, generated from the schema change in the repo's usual
  `NNNN_name.sql` + `meta/` journal form, drops `biz.tasks` and `biz.compliance_dates`. The rows
  are dropped as they are; no export (Define decision, Jamie 2026-09-25). Forward-only, per
  `migrations.reversible: false`.
- **Docs** — the admin-dashboard README (feed sections, the add-todo paragraph, the lead profile
  row), the services README (layout lines for the two query files) and the `AGENTS.md` routing row
  that sends "daily business todos / compliance deadlines" to the feed's Overdue section no longer
  describe what is gone.

The design canvas (https://claude.ai/artifact/EtnAmedYSgzwYG2jNKB3bC) is the visual reference for
the batch; this stub removes and adds nothing visual of its own.

## Acceptance criteria

- [ ] The feed at `/` shows no Overdue section and no compliance row or sheet, and its title bar has no add-todo button.
- [ ] The feed's "N things waiting on you" count no longer counts todos or compliance dates.
- [ ] A lead profile at `/leads/<id>` shows no Todos card, and every other card on it is unchanged.
- [ ] `packages/services` exports no task or compliance query, table or type, and nothing in the repo imports one (a repo-wide search for `listOpenTasks`, `createTask`, `complianceDates`, `queries/tasks` and `queries/compliance` finds nothing outside migrations).
- [ ] The four components (`overdue-list`, `add-todo`, `compliance-calendar`, `lead-todos`) and the todo/compliance server actions no longer exist.
- [ ] One new migration in `packages/services/drizzle` drops `biz.tasks` and `biz.compliance_dates`, and the journal lists it; the PR's `Validate migrations (no DB writes)` check is green (schema and committed migrations agree).
- [ ] After the merge, `Apply migrations to production` on `main` is green.
- [ ] The admin-dashboard README, the services README and `AGENTS.md` no longer mention todos, the Overdue section or compliance dates as live features.

## Out of scope

- Exporting the existing rows — they are dropped as they are (Define decision).
- Proving the migration on a Neon branch — this repo runs `database.isolation: none`; CI's validate
  job and the post-merge apply are the proof (Define decision).
- Any Google Tasks integration [D-16].
- Any other change to the feed — the Inbox is rebuilt in `inbox-rebuild`.
- Money, Leads list, and every design-tier change — later stubs of this batch.

## Open questions

- none blocking. Note for Release: the migration applies on the push to `main` while Vercel is
  still building the new admin deployment, so for that window the previous deployment's feed and
  lead pages query tables that no longer exist and error. Accepted for a single-operator tool;
  smoke `/` and one `/leads/<id>` once the new deployment is live.
