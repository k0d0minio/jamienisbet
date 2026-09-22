import {
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import type { FormAnswers, FormSnapshot } from "../forms"

// A dedicated Postgres schema keeps this repo's tables isolated inside the shared
// Neon database. Created by the first generated migration.
export const biz = pgSchema("biz")

// The single lead table — the whole point of the admin dashboard. Every intake
// (a portfolio contact enquiry, a sellers-site referral) and every lead added by
// hand is one row here: one row per person, from first contact through to paying
// customer. There is deliberately no second table for "opportunities" — a lead
// that turns into repeat work is still the same relationship, and the money
// itself lives in Stripe.
//
// Field sizes mirror the Zod constraints in the two forms:
//   - portfolio contact  → websites/portfolio/lib/contact-schema.ts
//   - sellers referral   → websites/sellers-site/lib/referral-schema.ts
export const clients = biz.table("clients", {
  id: uuid("id").primaryKey().defaultRandom(),

  // ---- Identity & contact --------------------------------------------------
  // The person we're dealing with. `name` is always present; the rest depend on
  // the intake (contact enquiries carry an email, referrals a phone, either can
  // carry both). `company` is reserved for records enriched later — the public
  // forms never populate it (their `company` field is a bot honeypot).
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 40 }),
  company: varchar("company", { length: 120 }),

  // ---- Provenance & pipeline -----------------------------------------------
  // Which form/route created the lead: 'portfolio' | 'referral' | 'manual' |
  // 'import' (a seeded batch — the cold-outreach pool).
  source: varchar("source", { length: 30 }).notNull().default("portfolio"),
  // Which batch, in words: "2026-07-23 Mafra/Lisbon prospect list". Provenance
  // for an imported row and read-only like `source` — the first message out
  // has to be able to say where the data came from. Null on anything that
  // arrived through a form or by hand, where `source` says it all.
  sourceDetail: varchar("source_detail", { length: 200 }),
  // Which rung of the ladder they are on: the cold pool's 'prospect' and
  // 'nurture', then 'lead' | 'discussing' | 'active' | 'past', and the
  // terminal 'not_won'. See clientStatuses in queries/clients.ts for the
  // ordered set, and _system/contracts/CLIENTS.md (icm-board repo) for what
  // each rung means.
  status: varchar("status", { length: 20 }).notNull().default("lead"),

  // ---- Intake payload ------------------------------------------------------
  // The free-text they sent (a contact message or a referral's described need).
  intakeMessage: text("intake_message"),
  // Locale-invariant service id the visitor enquired about (portfolio Services
  // section), or null for a plain enquiry.
  service: varchar("service", { length: 40 }),
  // Referral attribution — the seller's payout key (referral intakes only).
  referralCode: varchar("referral_code", { length: 40 }),
  // Rough budget the lead indicated (referral intakes only).
  budget: varchar("budget", { length: 40 }),
  // Preferred call slot, stored verbatim as the "YYYY-MM-DDTHH:mm" value.
  preferredCallTime: varchar("preferred_call_time", { length: 20 }),

  // ---- The cold pool's profile ---------------------------------------------
  // What a prospect is, before there is any relationship to describe. An
  // imported row arrives with no message, no budget and no history — what it
  // has instead is a profile: what they do, where they are, which language to
  // open in, and the one line that says why they'd care. Nullable to a row,
  // because an inbound lead has none of it and is not lying by omission.
  //
  // Free text on purpose: the pool's sectors ("restaurant", "clínica dentária")
  // are the words the list itself used, and a lookup table for eleven of them
  // would be a join to read a label.
  sector: varchar("sector", { length: 60 }),
  town: varchar("town", { length: 80 }),
  // Which language to open in: 'en' | 'pt' | 'en-pt' (either does). See
  // clientLanguages in queries/clients.ts.
  language: varchar("language", { length: 8 }),
  // The pitch angle — the specific thing about *this* business that a first
  // message leads with ("menu is a PDF nobody can read on a phone"). The most
  // valuable field the pool carries, and the reason a drafted message can be
  // grounded rather than generic. Prose, not a tag.
  hook: text("hook"),
  // A/B/C, derived by rule from the facts below rather than scored — null
  // until someone (or the tiering pass) grades them. See fitTiers.
  fitTier: varchar("fit_tier", { length: 1 }),

  // ---- What their web presence looks like ------------------------------------
  // The evidence a tier is graded from, and what a first message can point at.
  // 'none' | 'social_only' | 'dated' | 'decent' — see websiteGrades.
  websiteUrl: varchar("website_url", { length: 300 }),
  websiteGrade: varchar("website_grade", { length: 20 }),
  // How many Google reviews they carry: a proxy for whether anyone is looking
  // after this, and the one number in the profile. Null = not looked up.
  reviewCount: integer("review_count"),

  // ---- The other two channels ------------------------------------------------
  // WhatsApp is a main entry point for a local SMB here, not a fallback: an
  // E.164 number the click-to-chat link is built from. Null means use `phone`
  // — most of the pool's numbers are the same one either way, and this column
  // exists for the businesses whose WhatsApp is a different line.
  whatsapp: varchar("whatsapp", { length: 40 }),
  // The handle without the '@' — for the ones whose whole web presence is an
  // Instagram page, which is a large slice of the pool.
  instagram: varchar("instagram", { length: 100 }),

  // ---- What this relationship is worth --------------------------------------
  // The agreed (or expected) value in EUR minor units — cents, the same
  // convention the Stripe amounts use. `billing_type` says how to read it:
  // 'one_off' means the whole engagement is worth this much; 'monthly' means
  // this much every month, which is what makes the recurring-revenue total on
  // the leads list add up. Both are Jamie's own figures, typed on the profile —
  // Stripe stays the source of truth for money actually invoiced and paid.
  valueMinor: integer("value_minor").notNull().default(0),
  billingType: varchar("billing_type", { length: 20 })
    .notNull()
    .default("one_off"),
  // The monthly support line beside a one-off — the "one-off + support" shape
  // (icm-board `_system/knowledge/pricing.md` § Support): crash fixes on call
  // for a build with state, priced by the build's complexity. 0 = none — a
  // landing page has no ongoing cost, and a client-owned build's ongoing work
  // is a retainer (`billing_type: monthly`), not this. Counts into the leads
  // list's */ month* total for active rows.
  supportMinor: integer("support_minor").notNull().default(0),

  // ---- How the deal is settled ----------------------------------------------
  // Not every engagement is paid in euros. `deal_type` says how to read the
  // figure above: 'cash' is the ordinary case (invoiced, and what the leads
  // list adds up as pipeline and recurring revenue); 'barter' means no money
  // changes hands — the work is traded for work, and `value_minor` is only what
  // that exchange is *worth*, which is why the totals keep it in a separate
  // "in kind" figure rather than counting it as money coming in.
  // `barter_terms` is the free-text record of what is actually being swapped.
  dealType: varchar("deal_type", { length: 20 }).notNull().default("cash"),
  barterTerms: text("barter_terms"),

  // ---- Commission & ownership ------------------------------------------------
  // Two ways an engagement pays beyond a fee, and both need to be visible on
  // the list rather than buried in a note. Stored in basis points so a half
  // percent is expressible without floats: 850 = 8.5%, 10000 = 100%.
  //
  // `commission_bps` — the cut taken on the client's own revenue, collected
  // through Stripe. `equity_bps` — the stake negotiated in their company.
  // Null on both means "not part of this deal"; zero is a deliberate nil.
  commissionBps: integer("commission_bps"),
  equityBps: integer("equity_bps"),

  // ---- Delivery --------------------------------------------------------------
  // When work actually started. Deliberately orthogonal to `status`: 'active'
  // says the deal is agreed, this says the doing has begun — which matters most
  // on a barter or equity-only deal, where there is no invoice in Stripe to
  // signal it. Null = not started.
  workStartedAt: timestamp("work_started_at", { withTimezone: true }),

  // ---- Internal ------------------------------------------------------------
  // Owner-only working notes, appended as the relationship develops.
  notes: text("notes"),

  // ---- Billing -------------------------------------------------------------
  // The linked Stripe Customer id (`cus_…`). Set the first time this lead is
  // billed (or linked by hand), it ties this row to the customer record that
  // owns their invoices/payments in Stripe. Stripe stays the source of truth
  // for money; this column is just the join key. Kept in sync from here — edits
  // to name/email/phone are pushed to the linked customer. Null = not yet
  // linked. `unique` so one Neon lead maps to at most one Stripe customer.
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),

  // ---- Delivery repo -------------------------------------------------------
  // The client's own GitHub delivery repository, "owner/name". Set the first
  // time a repo is connected to — or created for — this client from their
  // profile. `github_default_branch` caches the repo's default branch resolved
  // at connect time so the profile can deep-link without a live lookup. Both
  // null = not yet connected.
  githubRepo: varchar("github_repo", { length: 200 }),
  githubDefaultBranch: varchar("github_default_branch", { length: 100 }),

  // ---- Deal folder -----------------------------------------------------------
  // Which folder under icm-board's `workspaces/deals/` holds this relationship's
  // words and documents — the intake verdict, the look, the quote, the proposal,
  // the agreement, the form-answer snapshots. One home per fact (icm-board
  // decision D24): the *state* is this row, the *documents* are that folder, and
  // the dashboard reads the folder live and never writes state from it. Null =
  // no deal folder (a relationship that predates the workspace, or one that
  // never opened one). Unique when set: one folder, one relationship.
  dealSlug: varchar("deal_slug", { length: 80 }).unique(),

  // ---- Activity ------------------------------------------------------------
  // When Jamie last worked this relationship — set by status changes and profile
  // edits, or stamped by hand with "Mark touched". The leads list sorts on
  // coalesce(last_touched_at, created_at), so whoever has waited longest is at
  // the top. Null = never touched since intake.
  lastTouchedAt: timestamp("last_touched_at", { withTimezone: true }),

  // ---- What happens next ---------------------------------------------------
  // The spine of the whole lead engine: every open lead and every prospect
  // being worked carries *what happens next, and when*. `last_touched_at`
  // above records that something happened; these two record that something
  // is going to. Activity-based selling in two columns.
  //
  // Nullable, and nothing enforces them — the invariant is gentle on purpose
  // (Jamie's decision 7): a save is never refused for a missing next action.
  // What surfaces the gap is a read, not a constraint — the crack-finder
  // queries in queries/crack-finder.ts.
  //
  // `next_action` is a short imperative in Jamie's own words ("Call back after
  // lunch service"), 200 characters because it is a line on a row, not a note;
  // the notes column is where prose goes. `next_action_due` is when it is owed
  // — the due-today queue's sort key.
  nextAction: varchar("next_action", { length: 200 }),
  nextActionDue: timestamp("next_action_due", { withTimezone: true }),

  // Nurture only: when a parked relationship comes back. A prospect whose
  // cadence ran out — or anyone who said "not now" — is parked rather than
  // killed, and this is the date it wakes on (+90 days, by the cadence's
  // suggestion). It means nothing on any other rung, which is why
  // `setClientStatus` clears it when a row leaves `nurture`.
  wakeAt: timestamp("wake_at", { withTimezone: true }),

  // When their website was last read and the facts above proposed from it.
  //
  // Deliberately about the *pass*, not about the record: it is stamped by an
  // enrichment whether or not a single field was accepted, because "I looked
  // and there was nothing new" is exactly the answer the batch script needs in
  // order to skip a row next week. Null means nobody has looked.
  //
  // It is not `last_touched_at` and must never be confused with it. Reading a
  // stranger's home page is not contact, and stamping it as such would move a
  // lead down the staleness sort for having been researched.
  enrichedAt: timestamp("enriched_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Soft archive: null = active, a timestamp = archived (hidden by default).
  archivedAt: timestamp("archived_at", { withTimezone: true }),
},
// Two indexes, for the two things every read of this table does. `status` is
// what every screen partitions on — and it stopped being cheap the moment an
// imported pool made the cold rows the majority of the table. `last_touched_at`
// is half of the list's sort key, `coalesce(last_touched_at, created_at)`;
// Postgres can't use a plain column index for that expression, but it can for
// the queries that ask about the column itself, and it is the half that
// actually varies.
(t) => [
  index("clients_status_idx").on(t.status),
  index("clients_last_touched_at_idx").on(t.lastTouchedAt),
  // The third thing every read of this table now does: "what is owed today".
  // The crack-finder's due-outreach query orders on this column directly, and
  // most rows are null (a client is not on a cadence), so the index is small
  // and the scan it replaces is the whole table.
  index("clients_next_action_due_idx").on(t.nextActionDue),
])

// ---------------------------------------------------------------------------
// The memory of contact. One row per touch — a call made, an email sent, a
// walk-in, a WhatsApp, a DM — against the person it was with.
//
// This table existed once and migration 0013 dropped it, along with the AI deal
// pipeline it was part of (it held draft outreach emails and their document
// ceremony). It comes back leaner than it left: no versions, no provenance
// rows, no pipeline — a channel, a direction, an outcome, and the two optional
// bits of prose a touch can carry. What died was the ceremony; what was missing
// afterwards was the memory, and one overwritten `last_touched_at` on the lead
// is not one. Without this table there is no cadence, no follow-up discipline
// and no answer to "what happened with this one".
//
// Append-only in practice: a touch is a thing that happened, so nothing here
// edits or deletes one. It cascades with the client, because the history is
// part of that record rather than free-standing data.
export const touches = biz.table("touches", {
  id: uuid("id").primaryKey().defaultRandom(),

  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  // How it happened: 'email' | 'phone' | 'walkin' | 'whatsapp' | 'instagram' |
  // 'other'. Five first-class channels because Mafra has five — a local SMB is
  // reached by walking in as often as by email, and WhatsApp is a front door
  // here rather than a fallback. See touchChannels in queries/touches.ts.
  channel: varchar("channel", { length: 20 }).notNull(),
  // 'out' (I reached them) or 'in' (they reached me). See touchDirections.
  direction: varchar("direction", { length: 3 }).notNull().default("out"),
  // What came of it: 'sent' | 'answered' | 'no_answer' | 'callback' |
  // 'replied' | 'met' | 'not_interested'. The vocabulary the cadence reads to
  // decide what to suggest next — see touchOutcomes and ../cadence.
  outcome: varchar("outcome", { length: 20 }).notNull(),

  // What was actually said, in Jamie's words. Optional: the whole point of the
  // logging flow is that channel + outcome is two taps and enough, and a touch
  // nobody had ten seconds to annotate is still worth having.
  note: text("note"),
  // The draft that was used, if one was. Sequence 5 of the lead-engine epic
  // fills this from the AI Gateway; until then it is written by nothing and
  // read by the history's fold. Disposable by design — a copy of what went out,
  // not a versioned document.
  draftMd: text("draft_md"),
  // Which model drafted it. A courtesy field so a message that reads oddly can
  // be traced to the model that wrote it — deliberately not spend tracking,
  // which is the Gateway's budget's job.
  model: varchar("model", { length: 60 }),

  // When it happened, which is not always when it was logged: a call on the
  // road gets typed in that evening. Defaults to now, overridable by the
  // caller.
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
},
// One index, for the only read this table has: this client's history, newest
// first. Postgres scans a composite index backwards as happily as forwards, so
// the ascending form serves the descending order without a second index.
(t) => [index("touches_client_id_logged_at_idx").on(t.clientId, t.loggedAt)])

// ---------------------------------------------------------------------------
// The permanent floor under the outreach: who must never be contacted again.
//
// A suppression is not a property of a lead, which is the whole reason it is
// its own table with no foreign key. Somebody who says "take me off your list"
// has opted out of *being contacted*, and that survives everything that could
// happen to the row they were contacted through: archiving it, deleting it,
// purging it for retention, or re-importing the same business from a fresh
// batch next spring. A suppression keyed to a client id would die with the
// client and the next import would cheerfully write them back in.
//
// So the key is the contact point itself — an address, a number, a handle —
// stored normalized (see normalizeSuppressionValue in queries/suppressions.ts)
// so that "Geral@Example.PT" and "geral@example.pt" are the same opt-out, and
// "912 345 678" and "+351912345678" are the same number.
//
// Nothing in this package deletes a row from here, and that is deliberate
// rather than unfinished — see the note above `suppressContactPoints`.
export const suppressions = biz.table("suppressions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Which kind of contact point: 'email' | 'phone' | 'instagram'. The three
  // channels that carry an address you can hold onto — a walk-in has no
  // identifier to suppress, and a phone number covers the call and the
  // WhatsApp alike, because they are the same number arriving by two doors.
  // See suppressionKinds in queries/suppressions.ts.
  kind: varchar("kind", { length: 20 }).notNull(),
  // The contact point, normalized: lowercased email, E.164 phone, bare
  // lowercase handle. 200 characters matches the widest column it mirrors
  // (`clients.email`).
  value: varchar("value", { length: 200 }).notNull(),

  // Why, in Jamie's words — "Replied: remove me", "Asked at the door". Null
  // is allowed (an opt-out is valid without an explanation), but the profile's
  // gesture always offers to record one, because in a year the reason is the
  // only thing that says whether this was a request or a mistake.
  reason: varchar("reason", { length: 200 }),

  // When they opted out. Never moved: a second opt-out through the same
  // channel is the same opt-out, so the insert is a no-op on conflict rather
  // than an update, and this stays the date it was first asked for.
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
// One contact point, one row. The unique constraint is what makes the import
// script's "skip anything suppressed" check a single indexed lookup, and what
// lets every write here be an idempotent insert.
(t) => [unique("suppressions_kind_value_key").on(t.kind, t.value)])

// ---------------------------------------------------------------------------
// The two working lists. Everything else on the dashboard is derived live from
// the leads table or read straight from Stripe.

// A manual business todo ("chase X", "prep for the Mafra meetup"). Optionally
// linked to a lead; completing is a soft flag (same idiom as archived_at) so
// the done history stays queryable.
export const tasks = biz.table("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  notes: text("notes"),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  // Null = open; a timestamp = done.
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// One questionnaire sent to one lead — the whole customer form builder, in a
// table. Created by "Send form" on a lead's profile, read by the public page at
// `<portfolio>/f/<id>`.
//
// The row's `id` doubles as the link token: a v4 uuid is unguessable, so a
// customer needs no account to answer, and nothing else has to be minted or
// kept in step with it. `form_snapshot` is the parsed markdown frozen at send
// time (see ../forms.ts) — the reason a form already in someone's inbox never
// changes under them when the markdown (icm-board's
// `workspaces/sell/references/forms/`, or a client repo's `.icm/onboarding/`)
// is edited. `answers`
// is null until they submit; `completed_at` is what makes the link one-shot.
export const formLinks = biz.table("form_links", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Whose form this is. Cascades: deleting a lead takes their questionnaires
  // with them — the answers are part of that record, not free-standing data.
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  // Which markdown file was sent, e.g. "project-intake". Kept alongside the
  // snapshot as provenance — the snapshot is what renders, this is what tells
  // you which questionnaire someone was asked when you compare two sends.
  formSlug: varchar("form_slug", { length: 100 }).notNull(),

  formSnapshot: jsonb("form_snapshot").$type<FormSnapshot>().notNull(),
  answers: jsonb("answers").$type<FormAnswers>(),

  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  // Null = sent, awaiting a response. A timestamp = submitted, and the link is
  // spent: revisiting it shows a dead-end rather than the form again.
  completedAt: timestamp("completed_at", { withTimezone: true }),
})

// A Portuguese compliance obligation (IRS payment-on-account, Segurança Social
// declaration, IES, …). Rows are decision-support only — `notes` must carry the
// source + as-of date per the legal/tax standing rule, and everything here
// needs the contabilista's confirmation. Completing a recurring row inserts
// the next occurrence (no calendar math at read time) — see queries/compliance.ts.
export const complianceDates = biz.table("compliance_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  notes: text("notes"),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  // 'none' | 'monthly' | 'quarterly' | 'yearly' — see complianceRecurrences.
  recurrence: varchar("recurrence", { length: 20 }).notNull().default("none"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
