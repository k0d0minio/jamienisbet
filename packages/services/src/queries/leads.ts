import { desc, eq } from "drizzle-orm"

import { getDb } from "../client"
import { contactSubmissions, referralLeads } from "../schema"

export type NewContactSubmission = typeof contactSubmissions.$inferInsert
export type ContactSubmission = typeof contactSubmissions.$inferSelect
export type NewReferralLead = typeof referralLeads.$inferInsert
export type ReferralLead = typeof referralLeads.$inferSelect

// The referral pipeline stages the admin moves a lead through.
export const referralStatuses = ["new", "contacted", "won", "lost"] as const
export type ReferralStatus = (typeof referralStatuses)[number]

// ---- Writes (called by the site forms) -------------------------------------

export async function createContactSubmission(
  input: NewContactSubmission
): Promise<ContactSubmission> {
  const [row] = await getDb()
    .insert(contactSubmissions)
    .values(input)
    .returning()
  return row
}

export async function createReferralLead(
  input: NewReferralLead
): Promise<ReferralLead> {
  const [row] = await getDb().insert(referralLeads).values(input).returning()
  return row
}

// ---- Reads / updates (called by the admin dashboard) -----------------------

export async function listContactSubmissions(): Promise<ContactSubmission[]> {
  return getDb()
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt))
}

export async function listReferralLeads(): Promise<ReferralLead[]> {
  return getDb()
    .select()
    .from(referralLeads)
    .orderBy(desc(referralLeads.createdAt))
}

export async function setReferralStatus(
  id: string,
  status: ReferralStatus
): Promise<ReferralLead | undefined> {
  const [row] = await getDb()
    .update(referralLeads)
    .set({ status })
    .where(eq(referralLeads.id, id))
    .returning()
  return row
}
