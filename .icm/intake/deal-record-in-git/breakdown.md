# Breakdown: the dashboard reads and writes the relationship record in git

- scope-slug: deal-record-in-git
- found-by: icm-board restructure · 2026-10-07 (decisions D49, D50, D53 in icm-board's `.icm/project.md`)
- sources: icm-board `workspaces/deals/README.md` § The relationship record · `_system/contracts/CLIENTS.md` (rewritten from `packages/services/src/queries/clients.ts`) · `workspaces/threads/CONTEXT.md` · `_system/scripts/validate-deal.sh` · `websites/admin-dashboard/lib/deals.ts` (today's read-only dash-field parser)

## What was understood

Since 2026-10-05 the relationship's facts live in `workspaces/deals/<repo>/DEAL.md`'s YAML
frontmatter in icm-board — rung (`lead` · `discussing` · `active` · `past` · `not_won`),
`next_action` and `next_action_due`, `deadlines[]`, `value`, `billing_type`, `deal_type`,
`support`, `signed_at`, `work_started_at`, `lost_reason`, `github_repo`, `engagement`,
`invoices[]` (issued by hand in Revolut Pro — Stripe is pending, D53). Neon keeps the pool
(`prospect`, `nurture`), the form answers and the contact details. The dashboard today reads
the folder's old `- key:` dash-fields (`lib/deals.ts` → `dashFields`) and writes only the
`answers/` snapshots; the rung still lives on the Neon row. These four stubs make the dashboard
one more writer of the record file over the GitHub Contents API, move the money view onto the
record's `invoices[]`, add the deadlines-and-threads view the Friday review reads from a phone,
and give the public forms a token-protected route that writes answers without a session.

Nothing here changes icm-board; the schema is its contract. The stage names the dashboard
shows (`STAGE_NAMES`) also move to the renumbered line: 01 intake · 02 look · 03 offer ·
04 agreement · 05 onboarding · 06 kickoff · 07 handover, with the old names read as the same
positions for engagements opened before 2026-10-05.

## Build order

1. deal-record-read-write-git — parse the frontmatter, show the record beside the row, write a changed field back as one commit — depends-on: none
2. deadlines-and-threads-view — the Friday review on a phone: deadlines, next actions due, the open threads — depends-on: deal-record-read-write-git
3. money-view-reads-deal-invoices — the money view from `invoices[]`, Stripe pending — depends-on: deal-record-read-write-git
4. form-route-writes-answers-token — the public form route writes `answers/<form>.md` with a per-link token, no session — depends-on: deal-record-read-write-git
