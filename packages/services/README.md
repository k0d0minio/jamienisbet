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
  queries/leads.ts   # typed create/list/update helpers for the lead tables
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
import { createContactSubmission, listReferralLeads } from "@jamie-nisbet/services"
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

Today: lead capture (`contact_submissions`, `referral_leads`). Structured so future concerns —
hourly billing, Stripe invoicing, proposals — become additional tables in `schema/` and query
modules in `queries/`.
