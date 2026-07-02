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

export type DealPatch = Partial<Pick<Deal, "title" | "status" | "valueMinor">>

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

export async function deleteDeal(id: string): Promise<void> {
  await getDb().delete(deals).where(eq(deals.id, id))
}
