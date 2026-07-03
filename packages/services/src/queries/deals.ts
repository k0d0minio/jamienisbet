import { desc, eq } from "drizzle-orm"

import { getDb } from "../client"
import { deals } from "../schema"

export type Deal = typeof deals.$inferSelect
export type NewDeal = typeof deals.$inferInsert

// The deal lifecycle — the canonical set from
// _config/conventions/state-and-status.md ("lead / deal"). The client's own
// status stays the relationship summary; deals carry the per-opportunity
// state.
export const dealStatuses = [
  "new",
  "qualified",
  "proposed",
  "won",
  "lost",
] as const
export type DealStatus = (typeof dealStatuses)[number]

export async function createDeal(input: {
  clientId: string
  title: string
  valueMinor?: number
}): Promise<Deal> {
  const [row] = await getDb()
    .insert(deals)
    .values({
      clientId: input.clientId,
      title: input.title,
      valueMinor: input.valueMinor ?? 0,
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
  Pick<Deal, "title" | "status" | "valueMinor" | "paymentSchedule">
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
