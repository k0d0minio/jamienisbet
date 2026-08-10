# State & Status

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** Say where business state lives, so no automation has to guess which store to trust.

## One store: the Neon `biz.*` schema
Business state — leads, their statuses, todos, and the compliance calendar — lives in **one**
place: the Neon Postgres `biz` schema, defined in
[`packages/services/src/schema/index.ts`](../../packages/services/src/schema/index.ts). The
**repo holds no pipeline state**: no client records, no invoice statuses, no generated
dashboard. Git carries specification, apps, and config only.

You interact with the pipeline through the **admin dashboard**
([`websites/admin-dashboard/`](../../websites/admin-dashboard/)) — not through git files or
Claude repo routines. There is **no sync-back**: a status change lands in the database and
writes nothing to git.

**One row per person.** There is no separate opportunity/deal record: a lead who comes back for
more work is still the same relationship. What was actually billed is Stripe's business, not
the schema's (see [Where the business stands](#where-the-business-stands)).

## Status vocabularies (defined in code, not restated here)
Each status set is a `const` tuple in `@jamie-nisbet/services`; that is the canonical definition
and the only place to change it. Do not restate the values in docs — link to the source:

- **`biz.clients.status`** — the lead relationship, intake through delivery: `clientStatuses` in
  [`packages/services/src/queries/clients.ts`](../../packages/services/src/queries/clients.ts),
  alongside the `openStatuses` / `customerStatuses` groupings the dashboard filters on.
- **`biz.clients.billing_type`** — how that lead's `value_minor` is read: `billingTypes` in the
  same file. `one_off` is what the whole engagement is worth; `monthly` is charged every month
  and is what the dashboard's recurring total adds up. Both are Jamie's own figures — Stripe is
  the authority on what was invoiced and paid.
- **`biz.clients.last_touched_at`** — when the relationship was last worked. Stamped by status
  changes, profile edits, and the dashboard's explicit "Mark touched"; the leads list sorts on
  `coalesce(last_touched_at, created_at)` so whoever has waited longest is at the top.

## Where the business stands
Revenue, receivables, and the balance are read **live** from Stripe in the admin dashboard's
Money screen — Stripe is the source of truth for money, the `biz.*` tables for who is being
worked. There is no generated `state/dashboard.md` and no per-entity front-matter to aggregate.

Related: [`client-and-slug.md`](client-and-slug.md) · [`macro-pipeline.md`](macro-pipeline.md)
