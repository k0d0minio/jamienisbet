# Plan: drop-todos-compliance

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **The admin surface** — `websites/admin-dashboard/app/(app)/page.tsx` (drop the
   `listOpenTasks` / `listOpenComplianceDates` reads, `todos`, `compliance`, `calendar`, `filed`,
   `leads` from the feed's data, the Overdue section, the `AddTodo` title-bar action, and those two
   terms from the "N things waiting" sum), `app/(app)/leads/[id]/page.tsx` (drop
   `listOpenTasksForClient` from the `Promise.all` and the `LeadTodos` card), `leads/page.tsx`
   (only the stale comment at line 85), `app/(app)/actions.ts` (the Todos and compliance action
   blocks and their imports), then delete `components/{overdue-list,add-todo,compliance-calendar,lead-todos}.tsx`
   — done when: `grep -rn "listOpenTasks\|OverdueList\|AddTodo\|ComplianceCalendar\|LeadTodos\|createTask\|ComplianceDate" websites/`
   finds nothing.
2. **The services layer** — delete `packages/services/src/queries/tasks.ts` and
   `queries/compliance.ts`, their two re-exports in `src/index.ts`, and the `tasks` and
   `complianceDates` tables plus any recurrence constant/type used only by them in
   `src/schema/index.ts` (keep the "two working lists" comment block honest — it goes with them)
   — done when: `grep -rn "tasks\b\|complianceDates\|compliance_dates\|complianceRecurrences" packages/services/src`
   finds only unrelated prose (outreach/suppressions "compliance problem" comments).
3. **The migration** — `pnpm --filter @jamie-nisbet/services db:generate` (never hand-written,
   `_shared/project-rules.md` → Migrations) → one new `0026_*.sql` with `DROP TABLE "biz"."tasks"`
   and `DROP TABLE "biz"."compliance_dates"` plus its `meta/` snapshot and journal entry; no local
   `db:migrate` (`database.isolation: none`) — done when: the diff shows exactly one new
   migration dropping exactly those two tables, and the PR's `Validate migrations (no DB writes)`
   is green.
4. **Docs** — `websites/admin-dashboard/README.md` (the Lead row "todos", the Overdue bullet, the
   "writing a todo down" paragraph and the "ticking a todo" phrasing), `packages/services/README.md`
   (the two layout lines), `AGENTS.md` (the "Daily business todos / compliance deadlines" routing
   row and the Overdue mention) — done when: a grep of those three files for `todo`, `Overdue`,
   `compliance` finds no live-feature description.

## Risks

- **Deploy vs. migrate race on merge** — `db-migrations.yml` drops the tables on the push to
  `main` while Vercel still serves the previous admin deployment, whose `/` and `/leads/<id>`
  query them; signal: those pages error until the new deployment is live. Accepted (spec → Open
  questions); Release smokes both once the deployment is ready.
- **No revert path** — migrations are forward-only and "a code revert must tolerate the newer
  schema"; reverting this PR would restore code that reads dropped tables. Recovery is fix-forward
  via the `hotfix` lane, never a revert. Release records it on its `- migrations:` line.
- **Generate drift** — `db:generate` may pick up an unrelated uncommitted schema change; signal:
  the generated SQL touches anything besides the two tables. Stop and diff the schema against
  `main`.
- **Hidden consumers** — a leftover import breaks the admin build in CI; pass 1 and 2's greps are
  the guard.
