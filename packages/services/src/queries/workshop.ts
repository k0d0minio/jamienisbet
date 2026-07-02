import { asc, eq } from "drizzle-orm"

import { getDb } from "../client"
import { workshopMessages } from "../schema"

export type WorkshopMessage = typeof workshopMessages.$inferSelect

export type WorkshopRole = "user" | "assistant"

export async function listWorkshopMessages(
  dealId: string
): Promise<WorkshopMessage[]> {
  return getDb()
    .select()
    .from(workshopMessages)
    .where(eq(workshopMessages.dealId, dealId))
    .orderBy(asc(workshopMessages.createdAt))
}

export async function addWorkshopMessage(
  dealId: string,
  role: WorkshopRole,
  content: string
): Promise<WorkshopMessage> {
  const [row] = await getDb()
    .insert(workshopMessages)
    .values({ dealId, role, content })
    .returning()
  return row
}

/** Wipe a deal's workshop to start the brainstorm over. The crystallised
 * outlines produced from it are documents and are not touched. */
export async function clearWorkshop(dealId: string): Promise<void> {
  await getDb().delete(workshopMessages).where(eq(workshopMessages.dealId, dealId))
}
