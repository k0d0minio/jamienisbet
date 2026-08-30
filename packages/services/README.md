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
  cadence.ts         # what to do next and when — the outreach template, as a pure function
  deal.ts            # what a deal is made of — components, and the helpers over them
  forms.ts           # the questionnaire snapshot/answer types both apps share
  queries/clients.ts # typed intake/list/update helpers for the leads table
  queries/touches.ts     # the touch log: the three vocabularies, the history, logging one
  queries/suppressions.ts # the permanent opt-out list, keyed to the contact not the lead
  queries/crack-finder.ts # the four reads that notice what the writes never refuse
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

Today: **`clients`**, its history in **`touches`**, the permanent opt-out list in
**`suppressions`**, plus the three working lists. Every intake — a portfolio contact enquiry or a sellers-site
referral — creates one client row (the form only sets the `source` and which intake fields are
populated); there is no separate table per form. Each client then gets fleshed out as the
relationship moves up the ladder (`status`: `lead` → `discussing` → `active` → `past`, or the
terminal `not_won`; what each rung *means* is `_system/contracts/CLIENTS.md` in the `icm-board`
repo), with contact details and owner notes. A client can also be linked to its
Stripe customer via `stripe_customer_id` (unique) — set by the admin's billing flow, which owns the
Stripe side; `setClientStripeCustomerId` persists the link.

**Two rungs sit before that ladder, for the cold pool.** An imported business enters as
`prospect` (the cadence is running, they have not engaged) and is parked on `nurture` when the
cadence is spent — both are one row per relationship in this same table, because a prospect that
replies is the same record that later pays. Neither is in `openStatuses`, `customerStatuses` or
`activeStatuses`, which is what keeps the pool out of the admin's open-lead views, its staleness
nagging and its money totals; engagement moves a prospect straight to `discussing`, and `lead`
stays what it has always been — somebody who arrived on their own. Seven rungs in all, three of
which end or park the relationship.

A prospect carries a **profile** rather than an intake: `sector`, `town`, `language`
(`en`/`pt`/`en-pt`), `hook` (the pitch angle a first message leads with), `fit_tier` (A/B/C by
rule, null = untiered), `website_url` / `website_grade` (`none`/`social_only`/`dated`/`decent`) /
`review_count`, plus `whatsapp` and `instagram` as first-class channels — WhatsApp falls back to
`phone` when the column is null. `source` gains `import` for a seeded batch, and `source_detail`
names which one; both are provenance and stay off `ClientProfilePatch`. Every one of those
vocabularies is defined in `queries/clients.ts` with a label lookup beside it, the same shape the
status ladder uses.

**Deal terms are composable.** A deal is not a price with decorations — it is any combination
of four independent **components**, and it counts as *set* the moment one of them exists. None
is required, least of all a euro figure: an engagement paid in a stake or a cut of revenue is a
whole deal with no money in it anywhere.

| Component | Columns | What it holds |
|---|---|---|
| **cash** | `value_minor`, `billing_type` | EUR cents, read as the whole engagement (`one_off`) or as a figure charged every month (`monthly`) — which is what feeds the recurring-revenue total. |
| **barter** | `deal_type = 'barter'`, `barter_terms` | Work traded for work. `value_minor` is then what the swap is *worth*, not money coming in, so the admin totals it separately as *in kind*. The terms are free text: what is actually being exchanged. Picking the swap is itself a component, valued or not. |
| **equity** | `equity_bps` | The ownership stake negotiated in their company. Basis points — 850 = 8.5%. Null = not part of this deal. |
| **commission** | `commission_bps` | The cut taken on the client's own revenue, collected through Stripe. Same units. |

`deal_type` survives only as *how to read the € figure* — `cash` (the default) or in kind — which
is why cash and barter are the two readings of one number and never both at once. `work_started_at`
is not a component at all: it records when delivery actually began, orthogonal to `status` and to
what was agreed, because work often starts on a handshake and an equity-only deal has no first
invoice in Stripe to mark the moment. Toggled by `setClientWorkStarted`.

Both percentage columns are clamped to 0…`MAX_BPS` (100%) inside `updateClient`, so the ceiling
is an invariant of the table rather than a rule each form has to remember.

**`deal.ts` is the one place that answers "what is this deal made of."** Every surface reads it
rather than re-deriving an answer from `value_minor`:

| Helper | Answers |
|---|---|
| `dealComponents(terms)` | The components this deal actually has, in the order they deserve to be read — the euro figure, then the stake, then the cut. |
| `hasDeal(terms)` | Is there a deal at all? True as soon as any one component exists. |
| `dealTermsOf(terms)` | The same components keyed by name (`.cash`, `.barter`, …), for a caller that wants one term rather than the list — what the admin's money totals are built from. |
| `dealHeadline(terms)` | Which component gets to be the headline figure: cash when there is any, otherwise the strongest percentage, so an equity-only deal shows `12%` rather than nothing. |

It takes a structural `DealTerms` (the deal columns and nothing else), so a `Client` row, a form's
draft and a list row's projection can all be asked the same questions.

**Every lead carries what happens next.** `next_action` (200 characters, an imperative in
Jamie's own words) and `next_action_due` are the spine of the lead engine: `last_touched_at`
records that something happened, these record that something is going to. `wake_at` is the
third, and means something only on `nurture` — when a parked relationship comes back
(`setClientStatus` clears it the moment a row leaves that rung, because a date that is no longer
about anything is worse than no date).

**The invariant is gentle, and that is a decision.** Nothing refuses to save without a next
action — `setClientNextAction` takes null happily, and `parkClient` clears one on its way past.
A form that will not close until you have decided what happens next is a form you stop opening,
and a cadence you stop logging is worth less than a gap you can see. So the invariant lives in
`queries/crack-finder.ts` as four reads instead of four constraints:

| Question | Query |
|---|---|
| What is owed today? | `listDueOutreach` — cadence rungs due or overdue, ordered overdue first, then fit tier (untiered last), then due date |
| What has nothing planned? | `listWithoutNextAction` — being worked, with no action or no date on it; a decision with no date never reaches the queue, so it counts as lost |
| Who has woken up? | `listWokenNurture` — parked, and `wake_at` has passed |
| What conversation went cold? | `listIdleEngaged` — `discussing`, untouched for `IDLE_AFTER_DAYS` (14) |

`findCracks` runs all four in parallel. Sequence 6 of the lead-engine epic renders them on the
Needs you feed; sequence 4's operator scripts read the same functions, which is why they live
here rather than in a page. All four exclude archived rows and return whole `Client` rows.

**`touches` is the memory of contact** — one row per call, message, DM or walk-in, cascading
with the client. It existed once and migration `0013` dropped it along with the AI deal pipeline
it belonged to; it comes back leaner than it left: `channel` (whatsapp / phone / email / walkin
/ instagram / other), `direction` (out / in), `outcome` (sent / no_answer / callback / answered
/ replied / met / not_interested), an optional `note`, an optional `draft_md` with the `model`
that wrote it, and `logged_at`. No versions, no provenance table, no pipeline. `logTouch` stamps
the client's `last_touched_at` alongside the insert — a history row that left the lead looking
untouched would put them straight back on top of the staleness sort they just came off — and
never moves that stamp backwards, so a back-dated touch is history being filled in rather than
the relationship going quiet again. The three vocabularies follow the status ladder's shape:
ordered set, label lookup, guard.

**`suppressions` is the permanent floor under all of it.** One row per contact point that
has asked never to be contacted again: `kind` (email / phone / instagram), `value` stored
normalized (lowercased address, E.164 number, bare lowercase handle), an optional `reason`
in Jamie's words, and `created_at`. Unique on (`kind`, `value`), which makes every write an
idempotent `ON CONFLICT DO NOTHING` and the import script's check a single indexed lookup.

**It has no foreign key to `clients`, and that is the whole design.** A suppression is a
fact about an address, not about a lead, so it outlives the row it was asked through — the
archive, the delete, the retention purge, and next spring's re-import of the same business.
A `client_id` here would die with the client and the next import would write them straight
back in. For the same reason **nothing in this package deletes one**: an opt-out you can
un-tick is an opt-out the next import quietly walks past, so removing a mis-typed row is a
hand-written `DELETE` in psql rather than a tap on a phone.

| Helper | Answers |
|---|---|
| `normalizeSuppressionValue(kind, raw)` / `toE164(raw)` | The canonical form. Every read and every write goes through it — a value stored normalized and looked up raw is a suppression that silently does nothing. `toE164` assumes `DEFAULT_COUNTRY_CODE` (351) for a bare nine-digit number, which is what the pool is. |
| `contactPointsOf(client)` | Every way this lead can currently be reached, normalized and de-duplicated (`whatsapp` is the phone number for most of the pool and a second line for the rest). |
| `isSuppressed(kind, value)` | The single-channel check — what the import script asks at the door. |
| `findSuppressions(points)` / `suppressionsForClient(client)` | The same question for a whole lead or a whole batch, in one round trip, returning the rows so a dead-end state can say when and why. |
| `suppressContactPoints(points, reason)` | Record the opt-out. Idempotent; `created_at` stays the date it was *first* asked for. |
| `suppressClient(id, reason)` | The whole gesture as one call, the way `parkClient` is: suppress every contact point, log an inbound `not_interested` touch carrying the reason, move the lead to `not_won`, and clear the next action and any wake date. A surface that got three of those four right would leave someone who opted out sitting in tomorrow's queue. |

The record itself is kept rather than deleted: a business that opted out and then appears in
a later list should read as *the one that asked to be left alone*, not as a blank a fresh
cadence starts against. What eventually clears the contact details is the retention rule, and
the suppression stays standing after it. The reasoning, the channel split it rests on
(role addresses at companies are opt-out under Lei 41/2004; a sole trader is a natural person
and gets phone or walk-in first) and the retention rule itself are written up in
[`.icm/docs/lia-cold-outreach.md`](../../.icm/docs/lia-cold-outreach.md).

**`cadence.ts` is the one place the shape of the outreach is written down.** A suggestion
engine, not a scheduler: nothing there writes, nothing runs on a timer, and nothing it returns
is binding. `CADENCE_STEPS` is ~5 touches over ~3 weeks as plain data — first touch on whichever
door is open, a second channel on day 3, a follow-up on day 7, a walk-in on day 12 for A-tier
leads with a town on file (the only "nearby" this model can honestly know), a last message on
day 19 — and `suggestNextTouch(lead, history)` reads a history and answers with one of three
things: the next rung, a reply owed to somebody who actually spoke, or a park onto `nurture`
waking `NURTURE_WAKE_DAYS` (90) out. It returns null after a "not interested", because there is
nothing to suggest after a no. `reachableChannels` / `bestChannel` are the same preference order
the first touch uses, exposed for anything else that needs to pick a door.

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
