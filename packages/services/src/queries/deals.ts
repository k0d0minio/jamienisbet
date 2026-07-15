import { desc, eq } from "drizzle-orm"

import { getDb } from "../client"
import { deals } from "../schema"

export type Deal = typeof deals.$inferSelect
export type NewDeal = typeof deals.$inferInsert

// The deal lifecycle — this tuple is the canonical set (docs reference it, not
// the other way round). The client's own status stays the relationship summary;
// deals carry the per-opportunity state.
export const dealStatuses = [
  "new",
  "qualified",
  "proposed",
  "won",
  "lost",
] as const
export type DealStatus = (typeof dealStatuses)[number]

// How a deal is billed. `one_off` is the default project shape (a `valueMinor`
// total, invoiced against the proposal's milestone `paymentSchedule`);
// `retainer` is recurring monthly revenue (`recurringAmountMinor` every
// `recurringInterval`, until `activeUntil`). This tuple is the canonical set.
export const billingTypes = ["one_off", "retainer"] as const
export type BillingType = (typeof billingTypes)[number]

// Retainer cadences. Only monthly today; kept as a set so another cadence can
// be added without a migration or a schema change downstream.
export const recurringIntervals = ["month"] as const
export type RecurringInterval = (typeof recurringIntervals)[number]

export async function createDeal(input: {
  clientId: string
  title: string
  valueMinor?: number
  billingType?: BillingType
  recurringAmountMinor?: number
  recurringInterval?: RecurringInterval
  activeUntil?: Date | null
}): Promise<Deal> {
  const [row] = await getDb()
    .insert(deals)
    .values({
      clientId: input.clientId,
      title: input.title,
      valueMinor: input.valueMinor ?? 0,
      billingType: input.billingType ?? "one_off",
      recurringAmountMinor: input.recurringAmountMinor ?? 0,
      recurringInterval: input.recurringInterval ?? "month",
      activeUntil: input.activeUntil ?? null,
    })
    .returning()
  return row
}

export async function listDealsForClient(clientId: string): Promise<Deal[]> {
  return getDb()
    .select()
    .from(deals)
    .where(eq(deals.clientId, clientId))
    .orderBy(desc(deals.createdAt))
}

/** All deals, newest first — the dashboard's pipeline metrics read. */
export async function listDeals(): Promise<Deal[]> {
  return getDb().select().from(deals).orderBy(desc(deals.createdAt))
}

export async function getDeal(id: string): Promise<Deal | undefined> {
  const [row] = await getDb().select().from(deals).where(eq(deals.id, id))
  return row
}

export type DealPatch = Partial<
  Pick<
    Deal,
    | "title"
    | "status"
    | "valueMinor"
    | "paymentSchedule"
    | "billingType"
    | "recurringAmountMinor"
    | "recurringInterval"
    | "activeUntil"
    | "onboardingState"
  >
>

export async function updateDeal(
  id: string,
  patch: DealPatch
): Promise<Deal | undefined> {
  const [row] = await getDb()
    .update(deals)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(deals.id, id))
    .returning()
  return row
}

// ---------------------------------------------------------------------------
// Payment schedule — the proposal's payment structure, stored on the deal so
// the "get paid" step can execute it milestone by milestone through Stripe.

export type PaymentMilestone = {
  /** Stable key (uuid) so an invoice can be linked back to its milestone. */
  id: string
  /** e.g. "50% deposit", "Balance on delivery". */
  label: string
  /** EUR minor units (cents), same convention as valueMinor. */
  amountMinor: number
  /** The Stripe draft invoice raised for this milestone; null until raised. */
  stripeInvoiceId?: string | null
}

/** Parse a deal's stored payment schedule; [] when none is set (or the JSON
 * is somehow malformed — the schedule is always rewritable from a new
 * proposal, so a broken value degrades to "no schedule"). */
export function parsePaymentSchedule(deal: Deal): PaymentMilestone[] {
  if (!deal.paymentSchedule) return []
  try {
    const parsed = JSON.parse(deal.paymentSchedule)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is PaymentMilestone =>
        typeof m === "object" &&
        m !== null &&
        typeof m.id === "string" &&
        typeof m.label === "string" &&
        typeof m.amountMinor === "number"
    )
  } catch {
    return []
  }
}

/** Replace the deal's payment schedule and keep valueMinor equal to its
 * total — the deal's value IS what the proposal says will be paid. */
export async function setDealPaymentSchedule(
  id: string,
  milestones: Omit<PaymentMilestone, "stripeInvoiceId">[]
): Promise<Deal | undefined> {
  const schedule: PaymentMilestone[] = milestones.map((m) => ({
    ...m,
    stripeInvoiceId: null,
  }))
  return updateDeal(id, {
    paymentSchedule: JSON.stringify(schedule),
    valueMinor: schedule.reduce((sum, m) => sum + m.amountMinor, 0),
  })
}

/** Record the Stripe invoice raised for one milestone. */
export async function linkMilestoneInvoice(
  dealId: string,
  milestoneId: string,
  stripeInvoiceId: string
): Promise<Deal | undefined> {
  const deal = await getDeal(dealId)
  if (!deal) return undefined
  const schedule = parsePaymentSchedule(deal).map((m) =>
    m.id === milestoneId ? { ...m, stripeInvoiceId } : m
  )
  return updateDeal(dealId, { paymentSchedule: JSON.stringify(schedule) })
}

export async function deleteDeal(id: string): Promise<void> {
  await getDb().delete(deals).where(eq(deals.id, id))
}

// ---------------------------------------------------------------------------
// Onboarding state — the won-deal checklist's stored half. Only the
// confirmations that cannot be derived from other data live here (ISO
// timestamps, set when Jamie ticks the step); everything derivable (contract
// approved, deposit invoiced, repo created) is computed at read time by the
// dashboard, so stored state and reality can never drift.

export type OnboardingState = {
  /** Jamie confirmed the approved contract went to the client. */
  contractSentAt?: string
  /** The delivery repo was seeded with the delivery-stage docs. */
  repoSeededAt?: string
  /** The kickoff call/meeting is in the calendar. */
  kickoffScheduledAt?: string
}

const onboardingKeys = [
  "contractSentAt",
  "repoSeededAt",
  "kickoffScheduledAt",
] as const
export type OnboardingStepKey = (typeof onboardingKeys)[number]

export function isOnboardingStepKey(value: string): value is OnboardingStepKey {
  return (onboardingKeys as readonly string[]).includes(value)
}

/** Parse a deal's stored onboarding state; {} when unset or malformed (every
 * field is a re-confirmable checkbox, so a broken value degrades safely). */
export function parseOnboardingState(deal: Deal): OnboardingState {
  if (!deal.onboardingState) return {}
  try {
    const parsed = JSON.parse(deal.onboardingState)
    if (typeof parsed !== "object" || parsed === null) return {}
    const state: OnboardingState = {}
    for (const key of onboardingKeys) {
      const value = (parsed as Record<string, unknown>)[key]
      if (typeof value === "string") state[key] = value
    }
    return state
  } catch {
    return {}
  }
}

/** Merge one confirmation into the deal's onboarding state (a Date stamps the
 * step done, null unticks it). */
export async function setOnboardingStep(
  dealId: string,
  step: OnboardingStepKey,
  at: Date | null
): Promise<Deal | undefined> {
  const deal = await getDeal(dealId)
  if (!deal) return undefined
  const state = parseOnboardingState(deal)
  if (at === null) {
    delete state[step]
  } else {
    state[step] = at.toISOString()
  }
  return updateDeal(dealId, { onboardingState: JSON.stringify(state) })
}

// ---------------------------------------------------------------------------
// Recurring revenue — the retainer side of the model. These are pure helpers so
// the dashboard's metric cards (open pipeline value, monthly recurring) read the
// same rules everywhere and can never drift from the schema.

/** A retainer is active when it is billed as a retainer, is not lost, and has
 * no end date in the past. `now` is passed in so callers stay deterministic. */
export function isActiveRetainer(deal: Deal, now: Date = new Date()): boolean {
  return (
    deal.billingType === "retainer" &&
    deal.status !== "lost" &&
    (deal.activeUntil === null || deal.activeUntil > now)
  )
}

/** The figure a deal contributes to a value roll-up: the recurring amount for a
 * retainer, the one-off value otherwise. Keeps a retainer from showing as €0
 * just because its one-off `valueMinor` is unset. */
export function dealHeadlineValueMinor(deal: Deal): number {
  return deal.billingType === "retainer" ? deal.recurringAmountMinor : deal.valueMinor
}

/** Total monthly recurring revenue across the given deals — the sum of every
 * active retainer's monthly amount (EUR minor units). */
export function monthlyRecurringMinor(
  dealList: Deal[],
  now: Date = new Date()
): number {
  return dealList
    .filter((d) => isActiveRetainer(d, now))
    .reduce((sum, d) => sum + d.recurringAmountMinor, 0)
}
