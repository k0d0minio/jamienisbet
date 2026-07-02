import { pgSchema, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

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

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Soft archive: null = active, a timestamp = archived (hidden by default).
  archivedAt: timestamp("archived_at", { withTimezone: true }),
})
