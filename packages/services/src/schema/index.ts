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
  // Expected or agreed value in EUR minor units (cents) — same convention as
  // the Stripe amounts the money helpers already format.
  valueMinor: integer("value_minor").notNull().default(0),
  // The proposal's payment structure, as agreed with the client: a JSON array
  // of milestones ({ id, label, amountMinor, stripeInvoiceId }). Written when
  // the proposal is drafted; the "get paid" step raises one Stripe draft
  // invoice per milestone and records the invoice id back here, so the
  // proposal's payment terms and the actual invoicing can never drift apart.
  // Null = no proposal drafted yet. See PaymentMilestone in queries/deals.ts.
  paymentSchedule: text("payment_schedule"),
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
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
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
