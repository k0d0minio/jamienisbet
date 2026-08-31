# Stub: A compliance date can no longer be added — the form went with the working list

- lane: bug
- found-by: closing `contabilista-dead-ticket-link`, 2026-08-31
- priority: P2
- size: S

## What this is

`biz.compliance_dates` is write-only from the outside now. The dashboard reads it
(`listOpenComplianceDates` → the **Needs you** feed's Overdue section) and can tick a row
off (`completeComplianceDateAction`, which re-arms a recurring one), but there is no way
to put a date in.

The form existed. `components/compliance-list.tsx` carried the whole thing — title, notes,
due date, a recurrence select, add and delete — until the working-list strip was retired
in `120338e` (*Make the app open on what needs you*, the `admin-native-redesign/needs-you-inbox`
stub). The todo add form was deliberately rehomed at the same time: `components/add-todo.tsx`
says so in its header comment, and it hangs off the Needs you title bar as a `+`. The
compliance form was not rehomed — it just went, and its server actions were left standing:

- `websites/admin-dashboard/app/(app)/actions.ts:1710` — `addComplianceDateAction`, no callers
- `websites/admin-dashboard/app/(app)/actions.ts:1740` — `deleteComplianceDateAction`, no callers

So this is one finding wearing two hats: a hole in the cockpit, and the dead code that
proves it wasn't intended.

It matters because of what is queued behind it. §5 of
[`.icm/docs/contabilista/02-trabalhador-independente-obligations.md`](../../docs/contabilista/02-trabalhador-independente-obligations.md)
is a full year of PT obligations — SS contributions, quarterly declarations, IVA, VIES,
IRS, pagamentos por conta — waiting on the contabilista's confirmation. The day she returns
the pack reviewed, entering them is the next move, and today there is nowhere to type them.
P2 because that day hasn't come; it is P1 the moment it does.

## What closing it takes

Give the compliance calendar an add form again, in whichever spot the Needs you feed
argues for — `add-todo.tsx`'s header comment is the reasoning to answer, not to copy:
a todo is written down constantly, a compliance date perhaps a dozen times ever, so a
second `+` on the title bar is probably the wrong shape. Delete is the same question:
`deleteComplianceDateAction` should either get a caller or go.

The old component reads clean and is worth starting from —
`git show 120338e^:websites/admin-dashboard/components/compliance-list.tsx` — but it
predates the app tier, so it needs the current primitives (`AppField`, `AppInput`,
`AppSelect`, `PendingButton`, `Sheet`, `toast`) rather than the raw shadcn ones it imports.

Two things the UI has to keep saying, because the rows are decision-support only:
`notes` carries the source + as-of date, per the legal/tax standing rule and the schema
comment at `packages/services/src/schema/index.ts:402`; and the standing caveat already
on the Overdue section — *every date still needs your contabilista's confirmation* —
belongs on the form too.

No schema or query work: `createComplianceDate` and `deleteComplianceDate` are already
there in `packages/services/src/queries/compliance.ts`, and the recurrence contract
(`complianceRecurrences`, completion inserting the next occurrence) is unchanged.

## Prompt

The admin dashboard in the jamienisbet repo can read and complete compliance dates but
can't add one — the form was lost when the working-list strip was retired, leaving
`addComplianceDateAction` and `deleteComplianceDateAction` in
`websites/admin-dashboard/app/(app)/actions.ts` with no callers. Read
`.icm/intake/triage/compliance-dates-no-add-form.md` first for the full context and the
constraints, then restore the ability to add (and decide about deleting) a compliance
date in the Needs you feed.

This is UI work in this repo's design system — the `design-dna` skill is the per-turn
checklist, and `packages/ui` is the source of truth for tokens and components. CI is the
source of truth; don't run builds, lint or typecheck locally. Work on a `claude/` branch,
push, open a PR, and `git mv` this stub to `.icm/intake/triage/_done/` in that PR.
