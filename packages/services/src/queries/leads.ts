import { desc, eq, isNotNull, isNull } from "drizzle-orm"

import { getDb } from "../client"
import { contactSubmissions, referralLeads } from "../schema"

// Lists default to active (non-archived) rows; pass { archived: true } to view
// the archive instead.
export type ListOptions = { archived?: boolean }

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

export async function listContactSubmissions(
  opts: ListOptions = {}
): Promise<ContactSubmission[]> {
  return getDb()
    .select()
    .from(contactSubmissions)
    .where(
      opts.archived
        ? isNotNull(contactSubmissions.archivedAt)
        : isNull(contactSubmissions.archivedAt)
    )
    .orderBy(desc(contactSubmissions.createdAt))
}

export async function listReferralLeads(
  opts: ListOptions = {}
): Promise<ReferralLead[]> {
  return getDb()
    .select()
    .from(referralLeads)
    .where(
      opts.archived
        ? isNotNull(referralLeads.archivedAt)
        : isNull(referralLeads.archivedAt)
    )
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

// ---- Archive / restore / delete --------------------------------------------
// Archive is a reversible soft-hide (sets archived_at); delete is permanent.

export async function setContactArchived(
  id: string,
  archived: boolean
): Promise<ContactSubmission | undefined> {
  const [row] = await getDb()
    .update(contactSubmissions)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(contactSubmissions.id, id))
    .returning()
  return row
}

export async function deleteContactSubmission(id: string): Promise<void> {
  await getDb().delete(contactSubmissions).where(eq(contactSubmissions.id, id))
}

export async function setReferralArchived(
  id: string,
  archived: boolean
): Promise<ReferralLead | undefined> {
  const [row] = await getDb()
    .update(referralLeads)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(referralLeads.id, id))
    .returning()
  return row
}

export async function deleteReferralLead(id: string): Promise<void> {
  await getDb().delete(referralLeads).where(eq(referralLeads.id, id))
}
