import { asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm"

import { getDb } from "../client"
import { normalizeBps, type BillingType, type DealType } from "../deal"
import { clients } from "../schema"

// Lists default to active (non-archived) rows; pass { archived: true } to view
// the archive instead.
export type ListOptions = { archived?: boolean }

export type NewClient = typeof clients.$inferInsert
export type Client = typeof clients.$inferSelect

// The lead lifecycle. Two rungs *before* the ladder proper for the cold pool,
// then five running from first contact to the two ways a relationship ends; the
// admin moves a lead along it from the list or their profile. What each rung
// *means* — and what you do when a lead is on it — is
// _system/contracts/CLIENTS.md in the icm-board repo.
//
//   prospect   — imported, working the cadence, hasn't engaged
//   nurture    — parked: the cadence ran out, or "not now". Wakes on a date
//   lead       — they arrived, nobody has replied yet
//   discussing — in conversation: scoping, quoting, waiting on their answer
//   active     — the deal is agreed; they are working with me
//   past       — the engagement ended, the relationship is kept
//   not_won    — terminal; ended without a deal
//
// The stored strings read as words on purpose — no legacy codes — and their
// labels (Prospect · Nurture · Lead · In discussion · Active client · Past
// client · Not won) live in `clientStatusLabels` below. That lookup is the one
// place a stored status becomes text: no surface capitalises or mangles the raw
// string into the UI.
//
// The two cold rungs are a pool, not a queue. `lead` stays what it has always
// been — somebody who arrived on their own — so a prospect never becomes one:
// the moment a cold row engages (a reply, an answered call) it goes straight to
// `discussing`, which is what "we are talking" has always meant. That is why
// nothing here defaults to `prospect`; an imported row is filed as one
// explicitly, by the thing that imports it.
//
// `past` and `nurture` are never reached by the ladder's own arithmetic — both
// are hand moves, made when an engagement ends or a cadence runs out, because
// nothing here can know when that is.
//
// Deliberately short. The old seven-rung CRM ladder (contacted/qualified/
// proposed as three separate rungs, won and delivered as two) split states a
// one-man business never acts on differently, and duplicated signals that
// already exist orthogonally: whether the doing has begun is `work_started_at`,
// and whether money has moved is Stripe.
export const clientStatuses = [
  "prospect",
  "nurture",
  "lead",
  "discussing",
  "active",
  "past",
  "not_won",
] as const
export type ClientStatus = (typeof clientStatuses)[number]

/** The readable word for each rung — the one lookup that ever turns a stored
 *  status into UI text (labels come from here, never from capitalising the raw
 *  string). */
export const clientStatusLabels: Record<ClientStatus, string> = {
  prospect: "Prospect",
  nurture: "Nurture",
  lead: "Lead",
  discussing: "In discussion",
  active: "Active client",
  past: "Past client",
  not_won: "Not won",
}

/** The line under each rung wherever a status is *chosen* rather than read —
 *  the sheet on a lead's page, and (as a comment) the two other copies of this
 *  vocabulary in the dashboard. Sentence case, no full stop: it is a caption,
 *  not a sentence. */
export const clientStatusHints: Record<ClientStatus, string> = {
  prospect: "Imported, working the cadence, hasn't engaged",
  nurture: "Parked; wakes on a date",
  lead: "Came in, not spoken to yet",
  discussing: "Conversation or negotiation running",
  active: "Work agreed or under way",
  past: "Engagement over, relationship kept",
  not_won: "Didn't happen",
}

/** The single accessor surfaces read from: callers hold a `string`, not a
 *  `ClientStatus`, and an unknown value falls through to the raw string so a
 *  stale row on screen still names itself. */
export function clientStatusLabel(status: string): string {
  return clientStatusLabels[status as ClientStatus] ?? status
}

// The statuses that mean "still being worked" — the ones the leads list treats
// as open, and the only ones that can go stale. A client isn't owed a reply,
// and neither a lost nor a past one is: the relationship is over for both, only
// the past one stays on the list.
//
// Unchanged by the cold pool, deliberately. A prospect is not an open lead: it
// owes nobody a reply, so "waiting 12 days" is a lie about it and the staleness
// nag would be eighty rows of noise the day the pool lands. What drives a
// prospect is its own next action and due date, not how long it has sat.
export const openStatuses: readonly ClientStatus[] = ["lead", "discussing"]

// The statuses that mean "this person pays me" — what makes a lead a customer
// and what the Clients filter gathers. Active and past both sit here; the
// money totals and the staleness nagging look only at `active`, because a past
// client's engagement — and retainer — is over.
export const customerStatuses: readonly ClientStatus[] = ["active", "past"]

// The live engagement: the only status the monthly and in-kind totals count.
export const activeStatuses: readonly ClientStatus[] = ["active"]

// A relationship whose engagement has ended but is kept warm — listed (muted)
// under Clients, never stale, never in a money figure.
export const pastStatuses: readonly ClientStatus[] = ["past"]

// The cold pool: everything that was imported rather than arriving, and hasn't
// engaged yet. It is in none of the four sets above and that is the whole
// point — never open, never a customer, never stale, never in a total. The
// leads list gives it a view of its own so the roster stays a list of
// relationships rather than a list of strangers.
export const prospectStatuses: readonly ClientStatus[] = ["prospect", "nurture"]

// Parked, inside that pool: the cadence is spent or they said "not now", and
// they wake on a date rather than on a nudge. Shown muted among the prospects
// the way a past client is shown muted among the clients.
export const nurtureStatuses: readonly ClientStatus[] = ["nurture"]

export function isClientStatus(value: string): value is ClientStatus {
  return (clientStatuses as readonly string[]).includes(value)
}

// Where a lead came from. `portfolio`/`referral` are set by the public forms;
// `manual` is for records the owner adds directly from the dashboard; `import`
// is a seeded batch — the cold pool — where `source_detail` names which one.
export const clientSources = ["portfolio", "referral", "manual", "import"] as const
export type ClientSource = (typeof clientSources)[number]

export function isClientSource(value: string): value is ClientSource {
  return (clientSources as readonly string[]).includes(value)
}

// ---- The cold pool's vocabularies -------------------------------------------
// Three small closed sets stored as plain varchars, each with the same shape as
// the status ladder above: the ordered set, a label lookup, and a guard for the
// value coming off a form. Labels live here for the same reason status labels
// do — so no surface ever capitalises a stored string into the UI.

/** Which language to open in. `en-pt` is the honest third answer for a business
 *  that reads either — most of Mafra's do. */
export const clientLanguages = ["en", "pt", "en-pt"] as const
export type ClientLanguage = (typeof clientLanguages)[number]

export const clientLanguageLabels: Record<ClientLanguage, string> = {
  en: "English",
  pt: "Portuguese",
  "en-pt": "Either",
}

export function clientLanguageLabel(value: string | null): string | null {
  if (!value) return null
  return clientLanguageLabels[value as ClientLanguage] ?? value
}

export function isClientLanguage(value: string): value is ClientLanguage {
  return (clientLanguages as readonly string[]).includes(value)
}

/** How good a fit they are, by rule rather than by score — at a few hundred
 *  leads three buckets beat a number nobody can explain. Null = untiered. */
export const fitTiers = ["A", "B", "C"] as const
export type FitTier = (typeof fitTiers)[number]

/** What each tier means when it is being *chosen*. The letter alone is what a
 *  row shows — it is the sort key, and it needs no gloss there. */
export const fitTierHints: Record<FitTier, string> = {
  A: "Clear need, reachable, worth the effort",
  B: "Plausible — worth a cadence",
  C: "Long shot; last in the queue",
}

export function isFitTier(value: string): value is FitTier {
  return (fitTiers as readonly string[]).includes(value)
}

/** What their web presence amounts to — the evidence behind a tier and the
 *  thing a first message can point at. `none` is a graded finding ("they have
 *  no website"), which is not the same as null ("nobody has looked"). */
export const websiteGrades = ["none", "social_only", "dated", "decent"] as const
export type WebsiteGrade = (typeof websiteGrades)[number]

export const websiteGradeLabels: Record<WebsiteGrade, string> = {
  none: "No website",
  social_only: "Social only",
  dated: "Dated",
  decent: "Decent",
}

export function websiteGradeLabel(value: string | null): string | null {
  if (!value) return null
  return websiteGradeLabels[value as WebsiteGrade] ?? value
}

export function isWebsiteGrade(value: string): value is WebsiteGrade {
  return (websiteGrades as readonly string[]).includes(value)
}

// The deal vocabulary — what a deal is made of, how to read its € figure, and
// the basis-point ceiling — lives in ../deal, which is also where the component
// helpers (`dealComponents`, `hasDeal`, `dealHeadline`) that every surface
// reads sit. This file stays about the table: its reads and its writes. Both
// are re-exported side by side from the package barrel, so consumers see one
// import surface either way.

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
 * `status` is what decides whether this reads as a lead or as a client: it
 * defaults to "lead" (a fresh lead) but any point in the lifecycle is valid, so
 * an existing client can be entered where they actually are rather than being
 * created as a lead and immediately advanced. `valueMinor`/`billingType`/
 * `dealType` come with them, since a client entered as "active" without a
 * figure — or with a barter figure counted as cash — would leave the totals
 * wrong from the moment they were added. The rest of the deal terms (commission,
 * equity, what is being swapped) distort nothing, so they are filled in on the
 * profile.
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
  dealType?: DealType
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
      status: input.status ?? "lead",
      valueMinor: input.valueMinor ?? 0,
      billingType: input.billingType ?? "one_off",
      dealType: input.dealType ?? "cash",
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

/**
 * Move a lead along the ladder — lead → discussing → active, or out to not_won.
 * `past` is a hand move too: only the owner knows when an engagement ends. So
 * are the two cold rungs: a prospect that engages is moved to `discussing` by
 * hand, and a prospect whose cadence is spent is parked on `nurture`.
 *
 * The `ClientStatus` type is the only gate: callers that take a status off the
 * wire narrow it with `isClientStatus` first (the dashboard's server action
 * does). Nothing else changes here on purpose — the rungs carry no side
 * effects, because everything a rung might have implied is its own orthogonal
 * flag: `work_started_at` for the doing, Stripe for the money, `archived_at`
 * for getting a lost lead off the list. See _system/contracts/CLIENTS.md in the icm-board repo.
 */
export async function setClientStatus(
  id: string,
  status: ClientStatus
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    // Working the ladder counts as touching the relationship — which is what
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

/**
 * Mark the work as begun (or un-mark it, if it was hit by mistake).
 *
 * Its own call rather than a field on the profile patch because it is a state
 * change you make in one tap from the lead's page, next to "Mark touched" —
 * not a number you type and save. Starting work is activity on the relationship
 * in the same way, so it stamps `lastTouchedAt` too. Re-starting an already
 * started engagement keeps the original date: the question the column answers
 * is "has this begun", and moving the date each time would lose when.
 */
export async function setClientWorkStarted(
  id: string,
  started: boolean
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({
      workStartedAt: started ? sql`coalesce(${clients.workStartedAt}, now())` : null,
      lastTouchedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning()
  return row
}

// The subset of profile fields the admin can edit by hand. Everything the
// intake captured (source, sourceDetail, service, referralCode, budget,
// preferredCallTime, createdAt) is provenance and stays read-only — the lead's
// own `valueMinor` is what supersedes the budget the form collected, and which
// batch a row was imported in is not something you fix by typing over it.
//
// The cold pool's facts are all editable: they arrive from an import or an
// enrichment pass, both of which are guesses a human corrects.
export type ClientProfilePatch = Partial<
  Pick<
    Client,
    | "name"
    | "email"
    | "phone"
    | "company"
    | "notes"
    | "sector"
    | "town"
    | "language"
    | "hook"
    | "fitTier"
    | "websiteUrl"
    | "websiteGrade"
    | "reviewCount"
    | "whatsapp"
    | "instagram"
    | "valueMinor"
    | "billingType"
    | "dealType"
    | "barterTerms"
    | "commissionBps"
    | "equityBps"
    | "workStartedAt"
  >
>

export async function updateClient(
  id: string,
  patch: ClientProfilePatch
): Promise<Client | undefined> {
  // The percentage columns are clamped here rather than trusted from the
  // caller: this is the one door every edit goes through, so 0…100% is an
  // invariant of the table instead of a rule each form has to remember.
  const safe = { ...patch }
  if ("commissionBps" in safe) safe.commissionBps = normalizeBps(safe.commissionBps)
  if ("equityBps" in safe) safe.equityBps = normalizeBps(safe.equityBps)

  const [row] = await getDb()
    .update(clients)
    // Editing the profile/notes is activity on the relationship — same as a
    // status change, it moves the lead back down the staleness sort.
    .set({ ...safe, lastTouchedAt: new Date() })
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
