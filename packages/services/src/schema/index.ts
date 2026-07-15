import {
  boolean,
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

// The single client table. Every intake — a portfolio contact enquiry or a
// sellers-site referral — creates one row here, which then gets fleshed out into
// a full profile (contact details, pipeline status, notes, and, over time,
// projects / quotes / proposals / invoices). There is no longer a separate
// table per form: the form only decides the `source` and which intake fields
// are populated.
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
  // Which form/route created the client: 'portfolio' | 'referral' | 'manual'.
  source: varchar("source", { length: 30 }).notNull().default("portfolio"),
  // Where the client sits in the intake → delivery pipeline. See clientStatuses
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

  // ---- Internal ------------------------------------------------------------
  // Owner-only working notes, appended as the relationship develops.
  notes: text("notes"),

  // ---- Billing -------------------------------------------------------------
  // The linked Stripe Customer id (`cus_…`). Set the first time this client is
  // billed (or linked by hand), it ties this row to the customer record that
  // owns their invoices/payments in Stripe. Stripe stays the source of truth
  // for money; this column is just the join key. Kept in sync from here — edits
  // to name/email/phone are pushed to the linked customer. Null = not yet
  // linked. `unique` so one Neon client maps to at most one Stripe customer.
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),

  // ---- Delivery repo -------------------------------------------------------
  // The client's own GitHub delivery repository, "owner/name" (the same pointer
  // kept as prose in shared/clients/<slug>/repo-link.md, now managed from the
  // dashboard). Set the first time a repo is connected to — or created for — this
  // client from their profile. Once set, the pipeline's AI runs (brainstorm,
  // pitch, proposal) load a snapshot of it as Layer-4 working material, so
  // suggestions are grounded in the actual codebase. `github_default_branch`
  // caches the repo's default branch resolved at connect time (avoids a live
  // lookup on every generation). Both null = not yet connected.
  githubRepo: varchar("github_repo", { length: 200 }),
  githubDefaultBranch: varchar("github_default_branch", { length: 100 }),

  // ---- Activity ------------------------------------------------------------
  // When Jamie last worked this relationship — set by status changes, profile
  // edits, and logged outreach touches. The stale-lead read on /today uses
  // coalesce(last_touched_at, created_at). Null = never touched since intake.
  lastTouchedAt: timestamp("last_touched_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Soft archive: null = active, a timestamp = archived (hidden by default).
  archivedAt: timestamp("archived_at", { withTimezone: true }),
})

// ---------------------------------------------------------------------------
// The ICM pipeline tables — the dashboard-side Layer 4. A client can carry
// several opportunities; each is a deal, and every AI-generated artifact for a
// deal is a document row that starts life as a draft and only becomes usable
// downstream once Jamie approves it (the repo's "no outbound action without a
// human-reviewed output" boundary, enforced in data rather than prose).

// One opportunity being worked for a client. Lifecycle is `dealStatuses` in
// queries/deals.ts (the canonical set): new → qualified → proposed → won |
// lost. There is deliberately no "stage" column — where a deal sits in the
// document pipeline is derived from which documents exist and are approved
// (see the dashboard's next-action logic), so the two can never drift.
export const deals = biz.table("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  // How this deal is billed: 'one_off' (a project — `value_minor` + a milestone
  // `payment_schedule`) or 'retainer' (recurring monthly revenue — the
  // `recurring_*` columns). See billingTypes in queries/deals.ts. Jamie's first
  // real client is a monthly retainer, so the model carries recurrence from the
  // jump rather than pretending every deal is a one-off.
  billingType: varchar("billing_type", { length: 20 })
    .notNull()
    .default("one_off"),
  // Expected or agreed value in EUR minor units (cents) — same convention as
  // the Stripe amounts the money helpers already format. For a retainer this is
  // the one-off value (usually 0); the recurring figure lives below.
  valueMinor: integer("value_minor").notNull().default(0),
  // The recurring charge for a retainer, in EUR minor units (cents), billed
  // every `recurring_interval`. Ignored for a one-off deal (stays 0). No
  // proration, no seats, no Stripe subscription object yet — just the monthly
  // amount and its cadence; a subscription id column can join here if/when
  // invoicing automates.
  recurringAmountMinor: integer("recurring_amount_minor").notNull().default(0),
  // The billing cadence for a retainer. Only 'month' today (see
  // recurringIntervals in queries/deals.ts); kept as a column so other cadences
  // can be added without another migration.
  recurringInterval: varchar("recurring_interval", { length: 10 })
    .notNull()
    .default("month"),
  // Optional end date for a retainer — null means open-ended (still active). A
  // retainer counts toward monthly recurring revenue only while it is active.
  activeUntil: timestamp("active_until", { withTimezone: true }),
  // The proposal's payment structure, as agreed with the client: a JSON array
  // of milestones ({ id, label, amountMinor, stripeInvoiceId }). Written when
  // the proposal is drafted; the "get paid" step raises one Stripe draft
  // invoice per milestone and records the invoice id back here, so the
  // proposal's payment terms and the actual invoicing can never drift apart.
  // Null = no proposal drafted yet. See PaymentMilestone in queries/deals.ts.
  paymentSchedule: text("payment_schedule"),
  // Won-deal onboarding: JSON of the confirmations that CANNOT be derived from
  // other data ({ contractSentAt?, repoSeededAt?, kickoffScheduledAt? } —
  // ISO strings). Everything derivable (contract approved, deposit invoiced,
  // repo created) is computed at read time, so the two can never drift. Same
  // JSON-in-text convention as payment_schedule. Null = nothing confirmed yet.
  // See OnboardingState in queries/deals.ts.
  onboardingState: text("onboarding_state"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// A generated (or hand-edited) pipeline artifact (content_md carries the
// document; content_html is legacy from the retired mockup kind).
// Regeneration never overwrites — it inserts the next version for the same
// (deal, kind), so the review trail stays intact.
export const documents = biz.table("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  // A DocumentKind from @jamie-nisbet/icm ("pitch" | "proposal").
  kind: varchar("kind", { length: 30 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  contentMd: text("content_md"),
  contentHtml: text("content_html"),
  version: integer("version").notNull().default(1),
  // draft → in_review → approved | rejected. Approval is a DB fact — nothing
  // downstream (stage advance, invoice, export) consumes a non-approved
  // document.
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  // Legacy flag from retired private kinds — no current kind sets it; kept
  // so the export route can keep refusing anything historical marked private.
  isPrivate: boolean("is_private").notNull().default(false),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// Provenance for every AI run — which model, which stage contract, which repo
// files went into the context, and what it cost. Makes each artifact auditable
// and points a repeatedly-wrong output back at the Layer-3 file to fix
// ("fix the source, not the symptom").
export const generations = biz.table("generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  // The deal a run belonged to — null for client-scoped runs (outreach drafts)
  // which carry client_id instead. One provenance table for every AI run keeps
  // the spend counters unified.
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "cascade",
  }),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  kind: varchar("kind", { length: 30 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  stageContractPath: text("stage_contract_path"),
  // JSON array of the repo files loaded into the context.
  contextFiles: text("context_files"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// The /today surface — what replaced the retired markdown tracker/. Manual
// todos and the compliance calendar live as rows; everything else on the
// morning brief (next actions, stale leads, receivables) is derived live.

// A manual business todo ("chase X", "prep for the Mafra meetup"). Optionally
// linked to a client; completing is a soft flag (same idiom as archived_at) so
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

// An outreach/follow-up/chase email drafted for a client — the draft-only
// outreach module. Same discipline as documents: versioned (regeneration
// inserts the next version, never overwrites) and review-gated (draft →
// in_review → approved; only an approved draft can be copied out). Sending
// stays manual and off-platform: `logged_at` records Jamie's own "I sent
// this" confirmation (the touch fact that un-stales the lead on /today),
// `channel` how it went out. Deliberately NOT a documents row — documents are
// deal-pipeline artifacts (deal_id NOT NULL, scanned by the next-action
// logic); a touch belongs to the client relationship.
export const touches = biz.table("touches", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  // 'outreach' | 'follow_up' | 'chase' — mirrors shared/templates/email/*.
  kind: varchar("kind", { length: 20 }).notNull(),
  contentMd: text("content_md"),
  version: integer("version").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  // Set when Jamie confirms he sent it (from his own email/WhatsApp — never
  // from here). Null = drafted but not sent.
  loggedAt: timestamp("logged_at", { withTimezone: true }),
  channel: varchar("channel", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// The technical-workshop chat, persisted per deal — the brainstorm is part of
// the deal's record and is the working material a project outline is
// crystallised from.
export const workshopMessages = biz.table("workshop_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 12 }).notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
