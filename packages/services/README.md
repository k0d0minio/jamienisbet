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
  forms.ts           # the questionnaire snapshot/answer types both apps share
  queries/clients.ts # typed intake/list/update helpers for the leads table
  queries/tasks.ts       # todos
  queries/compliance.ts  # the PT compliance calendar (recurrence re-arms on complete)
  queries/form-links.ts  # customer questionnaires: publish, read, submit once
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
populated); there is no separate table per form. Each client then gets fleshed out as the
relationship moves up the ladder (`status`: `new` → `talking` → `client`, or the terminal
`lost` — three rungs and a drop-out; what each one *means* is
`_system/contracts/CLIENTS.md` in the `icm-board` repo), with contact details
and owner notes. A client can also be linked to its
Stripe customer via `stripe_customer_id` (unique) — set by the admin's billing flow, which owns the
Stripe side; `setClientStripeCustomerId` persists the link.

**Deal terms.** What a relationship is worth is `value_minor` (EUR cents) read through
`billing_type` (`one_off` | `monthly`), plus four columns for the arrangements that aren't a
plain invoice:

| Column | What it holds |
|---|---|
| `deal_type` | `cash` (invoiced, the default) or `barter` — work traded for work, so `value_minor` is what the swap is *worth*, not money coming in. The admin totals it separately as *in kind*. |
| `barter_terms` | Free text: what is actually being exchanged. |
| `commission_bps` | The cut taken on the client's own revenue, collected through Stripe. Basis points — 850 = 8.5%. Null = not part of this deal. |
| `equity_bps` | The ownership stake negotiated in their company, same units. |
| `work_started_at` | When delivery actually began. Orthogonal to `status`: work often starts on a handshake, and a barter or equity-only deal has no first invoice in Stripe to mark the moment. Toggled by `setClientWorkStarted`. |

Both percentage columns are clamped to 0…`MAX_BPS` (100%) inside `updateClient`, so the ceiling
is an invariant of the table rather than a rule each form has to remember.

**Customer questionnaires.** `form_links` is one row per questionnaire sent to one lead. The
primary key doubles as the link token the customer opens (a v4 uuid — unguessable, so the form
needs no account), `form_snapshot` is the markdown from `.icm/onboarding/` frozen by the
dashboard at send time — in this repo for house questionnaires, or in the lead's own delivery
repo for ones written for them, which is what the snapshot's `sourceRepo` records (absent on
links sent before the library went multi-repo, all of which were house forms). `form_slug` stays
the bare filename either way. `answers` stays null until they submit. The freeze is the point:
questions are content in git, answers are business state here, and editing a question later can
never reinterpret answers already collected. `completed_at` makes the link one-shot —
`saveFormLinkAnswers` carries the "not yet completed" guard in its WHERE clause, so two racing
submissions can't both land. The snapshot and answer *types* live in `forms.ts` rather than in
either app, since the dashboard writes them and the portfolio reads them.

Structured so the rest of the pipeline — projects, quotes, proposals, invoicing — becomes
additional tables in `schema/` (keyed to `clients`) and query modules in `queries/`.
