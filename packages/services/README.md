# @jamie-nisbet/services

> **ICM role:** Layer 1 — router / Layer 3 — factory (shared logic).
> **Purpose:** The database models and business logic shared across the web estate —
> the persistence layer beneath [`websites/`](../../websites/), sibling to the design system
> in [`ui/`](../ui/).

## What this package accomplishes

One source of truth for **what the business stores and how it reads/writes it**. Websites and
the admin dashboard import typed models and query helpers from here instead of talking to the
database directly, so a schema or query change happens **once** and every consumer inherits it.

Built on **Drizzle ORM** over **Neon Postgres** (`@neondatabase/serverless`). Source-only, no
build step — consumers transpile the TypeScript via `transpilePackages` (same convention as
`@jamie-nisbet/ui`).

## Layout

```
src/
  client.ts          # lazy Drizzle client from DATABASE_URL — getDb() / db
  schema/index.ts    # Drizzle tables under the `biz` Postgres schema
  queries/clients.ts # typed intake/list/update helpers for the clients table
  index.ts           # barrel
drizzle/             # generated SQL migrations
drizzle.config.ts    # drizzle-kit config (scoped to the `biz` schema)
```

Everything lives under a dedicated **`biz` Postgres schema** so this repo's tables never
collide with anything else already using the same shared Neon database.

## Consuming it

Add `"@jamie-nisbet/services": "workspace:*"` to a site's `package.json`, add it to
`transpilePackages` in that site's `next.config.ts`, and set `DATABASE_URL` in the environment.

```ts
import { createClientFromContact, listClients } from "@jamie-nisbet/services"
```

## Migrations

Requires `DATABASE_URL` in the environment.

```bash
pnpm --filter @jamie-nisbet/services db:generate   # author SQL from the schema
pnpm --filter @jamie-nisbet/services db:migrate    # apply to the database
pnpm --filter @jamie-nisbet/services db:studio     # browse the data
```

The first migration creates the `biz` schema and its tables.

## Scope

Today: a single **`clients`** table. Every intake — a portfolio contact enquiry or a sellers-site
referral — creates one client row (the form only sets the `source` and which intake fields are
populated); there is no separate table per form. Each client then gets fleshed out through the
intake → delivery pipeline (`status`: `new` → `contacted` → `qualified` → `proposed` → `won` →
`delivered`, or `lost`), with contact details and owner notes. A client can also be linked to its
Stripe customer via `stripe_customer_id` (unique) — set by the admin's billing flow, which owns the
Stripe side; `setClientStripeCustomerId` persists the link.

Structured so the rest of the pipeline — projects, quotes, proposals, invoicing — becomes
additional tables in `schema/` (keyed to `clients`) and query modules in `queries/`.
