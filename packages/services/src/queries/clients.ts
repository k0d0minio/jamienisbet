import { desc, eq, isNotNull, isNull } from "drizzle-orm"

import { getDb } from "../client"
import { clients } from "../schema"

// Lists default to active (non-archived) rows; pass { archived: true } to view
// the archive instead.
export type ListOptions = { archived?: boolean }

export type NewClient = typeof clients.$inferInsert
export type Client = typeof clients.$inferSelect

// The client lifecycle — intake through to project delivery. Ordered from first
// touch to done; `lost` is the terminal drop-out. The admin moves a client
// along this pipeline.
export const clientStatuses = [
  "new",
  "contacted",
  "qualified",
  "proposed",
  "won",
  "delivered",
  "lost",
] as const
export type ClientStatus = (typeof clientStatuses)[number]

// Where a client came from. `portfolio`/`referral` are set by the public forms;
// `manual` is for records the owner adds directly.
export const clientSources = ["portfolio", "referral", "manual"] as const
export type ClientSource = (typeof clientSources)[number]

// ---- Intake (called by the site forms) -------------------------------------
// Both public forms funnel into the same clients table. The mapping from each
// form's fields onto the unified columns lives here, so the forms stay thin and
// the shape is owned in one place.

export type ContactIntake = {
  name: string
  email: string
  message: string
  // Locale-invariant service id the enquiry was about, if any.
  service?: string | null
  // Defaults to "portfolio"; overridable for future contact surfaces.
  source?: ClientSource
}

export async function createClientFromContact(
  input: ContactIntake
): Promise<Client> {
  const [row] = await getDb()
    .insert(clients)
    .values({
      name: input.name,
      email: input.email,
      intakeMessage: input.message,
      service: input.service ?? null,
      source: input.source ?? "portfolio",
    })
    .returning()
  return row
}

export type ReferralIntake = {
  referralCode: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  need: string
  budget?: string | null
  preferredCallTime?: string | null
}

export async function createClientFromReferral(
  input: ReferralIntake
): Promise<Client> {
  const [row] = await getDb()
    .insert(clients)
    .values({
      name: input.customerName,
      email: input.customerEmail ?? null,
      phone: input.customerPhone,
      intakeMessage: input.need,
      referralCode: input.referralCode,
      budget: input.budget ?? null,
      preferredCallTime: input.preferredCallTime ?? null,
      source: "referral",
    })
    .returning()
  return row
}

// ---- Reads (called by the admin dashboard) ---------------------------------

export async function listClients(opts: ListOptions = {}): Promise<Client[]> {
  return getDb()
    .select()
    .from(clients)
    .where(
      opts.archived
        ? isNotNull(clients.archivedAt)
        : isNull(clients.archivedAt)
    )
    .orderBy(desc(clients.createdAt))
}

export async function getClient(id: string): Promise<Client | undefined> {
  const [row] = await getDb().select().from(clients).where(eq(clients.id, id))
  return row
}

// ---- Updates (called by the admin dashboard) -------------------------------

export async function setClientStatus(
  id: string,
  status: ClientStatus
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({ status })
    .where(eq(clients.id, id))
    .returning()
  return row
}

// The subset of profile fields the admin can edit by hand. Intake provenance
// (source, service, referralCode, createdAt) is intentionally not editable.
export type ClientProfilePatch = Partial<
  Pick<
    Client,
    | "name"
    | "email"
    | "phone"
    | "company"
    | "budget"
    | "preferredCallTime"
    | "notes"
  >
>

export async function updateClient(
  id: string,
  patch: ClientProfilePatch
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set(patch)
    .where(eq(clients.id, id))
    .returning()
  return row
}

// Record (or clear) the Stripe Customer this client is linked to. Kept off the
// hand-editable ClientProfilePatch on purpose: the id is managed by the billing
// sync, never typed in. Pass null to unlink.
export async function setClientStripeCustomerId(
  id: string,
  stripeCustomerId: string | null
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({ stripeCustomerId })
    .where(eq(clients.id, id))
    .returning()
  return row
}

// Connect (or disconnect) the client's GitHub delivery repository. Like the
// Stripe link this is managed by an explicit action — the repo is chosen from a
// picker or freshly created, never hand-typed into the profile — so it stays off
// ClientProfilePatch. Pass null repo to disconnect. `defaultBranch` is the branch
// resolved at connect time, cached so the AI runs don't look it up every time.
export async function setClientRepo(
  id: string,
  repo: { githubRepo: string; githubDefaultBranch: string | null } | null
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set(
      repo
        ? {
            githubRepo: repo.githubRepo,
            githubDefaultBranch: repo.githubDefaultBranch,
          }
        : { githubRepo: null, githubDefaultBranch: null }
    )
    .where(eq(clients.id, id))
    .returning()
  return row
}

// ---- Archive / restore / delete --------------------------------------------
// Archive is a reversible soft-hide (sets archived_at); delete is permanent.

export async function setClientArchived(
  id: string,
  archived: boolean
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(clients.id, id))
    .returning()
  return row
}

export async function deleteClient(id: string): Promise<void> {
  await getDb().delete(clients).where(eq(clients.id, id))
}
