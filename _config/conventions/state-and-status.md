# State & Status

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** Say where business state lives, so no automation has to guess which store to trust.

## One store: the Neon `biz.*` schema
Business state — clients, deals, documents, their statuses, and the workshop chat — lives in
**one** place: the Neon Postgres `biz` schema, defined in
[`packages/services/src/schema/index.ts`](../../packages/services/src/schema/index.ts). The
**repo holds no pipeline state**: no client records, no deal/invoice statuses, no documents, no
generated dashboard. Git carries specification, apps, and config only.

You interact with the pipeline through the **admin dashboard**
([`websites/admin-dashboard/`](../../websites/admin-dashboard/)) and its AI — not through git
files or Claude repo routines. There is **no sync-back**: approving a document flips
`biz.documents.status` in the database and writes nothing to git.

## Status vocabularies (defined in code, not restated here)
Each status set is a `const` tuple in `@jamie-nisbet/services`; that is the canonical definition
and the only place to change it. Do not restate the values in docs — link to the source:

- **`biz.clients.status`** — the client relationship: `clientStatuses` in
  [`packages/services/src/queries/clients.ts`](../../packages/services/src/queries/clients.ts).
- **`biz.deals.status`** — per-opportunity state: `dealStatuses` in
  [`packages/services/src/queries/deals.ts`](../../packages/services/src/queries/deals.ts). One
  client can carry several deals.
- **`biz.deals.billing_type`** — how a deal is billed: `billingTypes` in
  [`packages/services/src/queries/deals.ts`](../../packages/services/src/queries/deals.ts). A
  `one_off` project carries a `value_minor` total invoiced against its milestone `payment_schedule`;
  a `retainer` carries recurring monthly revenue (`recurring_amount_minor` per `recurring_interval`,
  until an optional `active_until`). The dashboard's monthly-recurring and pipeline metrics read
  these through the `isActiveRetainer` / `monthlyRecurringMinor` helpers in the same file.
- **`biz.documents.status`** — the ICM review gate as data: `documentStatuses` in
  [`packages/services/src/queries/documents.ts`](../../packages/services/src/queries/documents.ts).
  An AI-generated document is a Layer-4 draft until Jamie approves it, and **only approved
  documents** feed anything downstream (dependent generators, the Stripe draft invoice, export).

## Where the business stands
Pipeline value, win rate, revenue, receivables and the like are read **live** in the admin
dashboard — Stripe is the source of truth for money, the `biz.*` tables for the pipeline. There
is no generated `state/dashboard.md` and no per-entity front-matter to aggregate.

Related: [`client-and-slug.md`](client-and-slug.md) · [`macro-pipeline.md`](macro-pipeline.md)
