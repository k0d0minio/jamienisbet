import {
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

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
  // Which form/route created the lead: 'portfolio' | 'referral' | 'manual'.
  source: varchar("source", { length: 30 }).notNull().default("portfolio"),
  // Where the lead sits in the intake → delivery pipeline. See clientStatuses
  // in queries/clients.ts for the ordered set.
  status: varchar("status", { length: 20 }).notNull().default("new"),

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
  // When work actually started. Distinct from `status`: a won lead is agreed,
  // this says the doing has begun — which matters most on a barter or
  // equity-only deal, where there is no invoice in Stripe to signal it.
  // Null = not started.
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

  // ---- Activity ------------------------------------------------------------
  // When Jamie last worked this relationship — set by status changes and profile
  // edits, or stamped by hand with "Mark touched". The leads list sorts on
  // coalesce(last_touched_at, created_at), so whoever has waited longest is at
  // the top. Null = never touched since intake.
  lastTouchedAt: timestamp("last_touched_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Soft archive: null = active, a timestamp = archived (hidden by default).
  archivedAt: timestamp("archived_at", { withTimezone: true }),
})

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
