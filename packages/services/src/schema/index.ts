import { pgSchema, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

// A dedicated Postgres schema keeps this repo's tables isolated inside the shared
// Neon database. Created by the first generated migration.
export const biz = pgSchema("biz")

// Portfolio contact form submissions. Field sizes mirror the Zod constraints in
// websites/portfolio/lib/contact-schema.ts (name ≤100, email ≤200, message ≤4000).
export const contactSubmissions = biz.table("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  message: text("message").notNull(),
  // Which site/form produced the lead — future-proofs a shared inbox.
  source: varchar("source", { length: 50 }).notNull().default("portfolio"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Sellers-site referral leads. Field sizes mirror the Zod constraints in
// websites/sellers-site/lib/referral-schema.ts. `status` drives the admin
// pipeline; `preferredCallTime` is stored verbatim as the "YYYY-MM-DDTHH:mm" slot.
export const referralLeads = biz.table("referral_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralCode: varchar("referral_code", { length: 40 }).notNull(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }),
  need: text("need").notNull(),
  budget: varchar("budget", { length: 40 }),
  preferredCallTime: varchar("preferred_call_time", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
