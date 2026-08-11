import { asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm"

import { getDb } from "../client"
import { clients } from "../schema"

// Lists default to active (non-archived) rows; pass { archived: true } to view
// the archive instead.
export type ListOptions = { archived?: boolean }

export type NewClient = typeof clients.$inferInsert
export type Client = typeof clients.$inferSelect

// The lead lifecycle — intake through to delivered work. Ordered from first
// touch to done; `lost` is the terminal drop-out. The admin moves a lead along
// this pipeline from the list or their profile.
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

// The statuses that mean "still being worked" — the ones the leads list treats
// as open, and the only ones that can go stale (a won or lost lead isn't
// waiting on anything).
export const openStatuses: readonly ClientStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposed",
]

// The statuses that mean "this person pays me" — what makes a lead a customer.
export const customerStatuses: readonly ClientStatus[] = ["won", "delivered"]

export function isClientStatus(value: string): value is ClientStatus {
  return (clientStatuses as readonly string[]).includes(value)
}

// Where a lead came from. `portfolio`/`referral` are set by the public forms;
// `manual` is for records the owner adds directly from the dashboard.
export const clientSources = ["portfolio", "referral", "manual"] as const
export type ClientSource = (typeof clientSources)[number]

// How a lead's `valueMinor` should be read: the whole engagement, or a figure
// charged every month (which is what feeds the recurring-revenue total).
export const billingTypes = ["one_off", "monthly"] as const
export type BillingType = (typeof billingTypes)[number]

export function isBillingType(value: string): value is BillingType {
  return (billingTypes as readonly string[]).includes(value)
}

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

/**
 * Add a record by hand — someone met at a meetup, a word-of-mouth introduction,
 * a customer who has been paying since before this dashboard existed. Anything
 * that never went through a form. Source is always "manual" and the row starts
 * as touched *now*, since typing it in is itself the first contact.
 *
 * `status` is what decides whether this reads as a lead or as a customer: it
 * defaults to "new" (a fresh lead) but any point in the lifecycle is valid, so
 * an existing customer can be entered where they actually are rather than being
 * created as a lead and immediately advanced. `valueMinor`/`billingType` come
 * with them, since a customer entered as "won" without a figure would leave the
 * recurring-revenue total wrong from the moment they were added.
 */
export async function createClientManually(input: {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  intakeMessage?: string | null
  notes?: string | null
  status?: ClientStatus
  valueMinor?: number
  billingType?: BillingType
}): Promise<Client> {
  const [row] = await getDb()
    .insert(clients)
    .values({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      intakeMessage: input.intakeMessage ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "new",
      valueMinor: input.valueMinor ?? 0,
      billingType: input.billingType ?? "one_off",
      source: "manual",
      lastTouchedAt: new Date(),
    })
    .returning()
  return row
}

// ---- Reads (called by the admin dashboard) ---------------------------------

/**
 * Every lead, longest-waiting first.
 *
 * The sort is the whole point of the list: `coalesce(last_touched_at,
 * created_at)` ascending puts whoever has heard nothing from Jamie for the
 * longest at the top, so the page opens on the work rather than on the newest
 * arrival. Ties (both null-touched, same intake) fall back to creation order.
 */
export async function listClients(opts: ListOptions = {}): Promise<Client[]> {
  return getDb()
    .select()
    .from(clients)
    .where(
      opts.archived
        ? isNotNull(clients.archivedAt)
        : isNull(clients.archivedAt)
    )
    .orderBy(
      asc(sql`coalesce(${clients.lastTouchedAt}, ${clients.createdAt})`),
      desc(clients.createdAt)
    )
}

export async function getClient(id: string): Promise<Client | undefined> {
  const [row] = await getDb().select().from(clients).where(eq(clients.id, id))
  return row
}

export type ClientRepo = {
  clientId: string
  clientName: string
  /** "owner/name", as stored by the delivery-repo connect action. */
  githubRepo: string
}

/**
 * Every delivery repo connected to an active client — the roster the tickets
 * board reads `.icm/intake/` from. Sorted by repo name so the board's repo rail
 * is stable regardless of lead activity.
 */
export async function listClientRepos(): Promise<ClientRepo[]> {
  const rows = await getDb()
    .select({
      clientId: clients.id,
      clientName: clients.name,
      githubRepo: clients.githubRepo,
    })
    .from(clients)
    .where(sql`${clients.githubRepo} is not null and ${clients.archivedAt} is null`)
    .orderBy(asc(clients.githubRepo))
  return rows.filter((r): r is ClientRepo => r.githubRepo !== null)
}

// ---- Updates (called by the admin dashboard) -------------------------------

export async function setClientStatus(
  id: string,
  status: ClientStatus
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    // Working the pipeline counts as touching the relationship — which is what
    // moves the lead back down the staleness sort.
    .set({ status, lastTouchedAt: new Date() })
    .where(eq(clients.id, id))
    .returning()
  return row
}

/** Stamp the lead as touched now (a call happened, an email went out, …)
 * without changing anything else. */
export async function touchClient(id: string): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({ lastTouchedAt: new Date() })
    .where(eq(clients.id, id))
    .returning()
  return row
}

// The subset of profile fields the admin can edit by hand. Everything the
// intake captured (source, service, referralCode, budget, preferredCallTime,
// createdAt) is provenance and stays read-only — the lead's own `valueMinor` is
// what supersedes the budget the form collected.
export type ClientProfilePatch = Partial<
  Pick<
    Client,
    "name" | "email" | "phone" | "company" | "notes" | "valueMinor" | "billingType"
  >
>

export async function updateClient(
  id: string,
  patch: ClientProfilePatch
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    // Editing the profile/notes is activity on the relationship — same as a
    // status change, it moves the lead back down the staleness sort.
    .set({ ...patch, lastTouchedAt: new Date() })
    .where(eq(clients.id, id))
    .returning()
  return row
}

// Record (or clear) the Stripe Customer this lead is linked to. Kept off the
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
// resolved at connect time, cached so the profile links straight to it.
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
