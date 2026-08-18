# JN-015 · Simplify the client status ladder to new → talking → client

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

`biz.clients` carries a seven-state CRM ladder (`new → contacted → qualified → proposed →
won → delivered`, plus `lost`) for a one-man business. Jamie's call (2026-08-18): fewer
states. The middle three are one state in practice ("we're talking"), and won/delivered
duplicates signals that already exist orthogonally (`work_started_at`, Stripe activity).

New ladder — `new` (arrived, not yet replied) → `talking` (in conversation; merges
contacted/qualified/proposed) → `client` (deal agreed; merges won/delivered), terminal
`lost`. Exported sets become `openStatuses = [new, talking]`,
`customerStatuses = [client]`. Delivery state stays on `work_started_at`.

This also creates the lifecycle contract the estate never had: what *happens* at each
rung, on one page.

## Acceptance

- [ ] Ladder is `new → talking → client` (+ `lost`); a migration maps existing rows
      (contacted/qualified/proposed → talking; won/delivered → client) losing no data
- [ ] `openStatuses`/`customerStatuses` updated; dashboard filter chips, header totals,
      ConvertFlow, and `conversionGaps()` all behave under the new ladder
- [ ] `_system/contracts/CLIENTS.md` exists: one page mapping each status to its action
      (new → reply task, see JN-023 · talking → send the scoping form, see JN-021 ·
      client → ConvertFlow until conversion gaps clear · lost → archive) and naming the
      orthogonal flags (`work_started_at`, `archived_at`, `stripe_customer_id`)
- [ ] CI green

## Prompt

Simplify the client status ladder in the jamienisbet monorepo. Read
.icm/intake/JN-015-simplify-client-status-ladder.md for full context. The new ladder is
new → talking → client, plus terminal lost; migrate existing rows
(contacted/qualified/proposed → talking; won/delivered → client). Touchpoints:
packages/services/src/schema/index.ts (status values + openStatuses/customerStatuses
exports), a new drizzle migration, setClientStatus and any status validation in
packages/services/src/queries/, the filter chips and header totals in
websites/admin-dashboard/app/(app)/page.tsx, and ConvertFlow + conversionGaps in
websites/admin-dashboard/app/(app)/leads/[id]/. Intake actions defaulting to `new` are
unchanged. Also write _system/contracts/CLIENTS.md, the one-page lifecycle contract
described in the ticket. Open a PR on a claude/ branch; do not run local checks — CI is
the source of truth.
