import { and, desc, eq, sql } from "drizzle-orm"

import { getDb } from "../client"
import { touches } from "../schema"
import { touchClient } from "./clients"

export type Touch = typeof touches.$inferSelect
export type NewTouch = typeof touches.$inferInsert

// The three outreach shapes — one per email template in
// shared/templates/email/. Canonical set (docs reference it).
export const touchKinds = ["outreach", "follow_up", "chase"] as const
export type TouchKind = (typeof touchKinds)[number]

export function isTouchKind(value: string): value is TouchKind {
  return (touchKinds as readonly string[]).includes(value)
}

// Same review gate as documents: nothing leaves as a copyable email until
// Jamie approves the draft.
export const touchStatuses = ["draft", "in_review", "approved"] as const
export type TouchStatus = (typeof touchStatuses)[number]

export function isTouchStatus(value: string): value is TouchStatus {
  return (touchStatuses as readonly string[]).includes(value)
}

/** All touches for a client, newest first — drafts and logged sends alike. */
export async function listTouchesForClient(clientId: string): Promise<Touch[]> {
  return getDb()
    .select()
    .from(touches)
    .where(eq(touches.clientId, clientId))
    .orderBy(desc(touches.createdAt))
}

export async function getTouch(id: string): Promise<Touch | undefined> {
  const [row] = await getDb().select().from(touches).where(eq(touches.id, id))
  return row
}

/** Insert the next version of a (client, kind) draft — regeneration never
 * overwrites, mirroring the documents idiom. */
export async function createTouchDraft(input: {
  clientId: string
  kind: TouchKind
  contentMd: string
}): Promise<Touch> {
  const [{ maxVersion }] = await getDb()
    .select({ maxVersion: sql<number>`coalesce(max(${touches.version}), 0)` })
    .from(touches)
    .where(
      and(eq(touches.clientId, input.clientId), eq(touches.kind, input.kind))
    )
  const [row] = await getDb()
    .insert(touches)
    .values({
      clientId: input.clientId,
      kind: input.kind,
      contentMd: input.contentMd,
      version: Number(maxVersion) + 1,
    })
    .returning()
  return row
}

export async function updateTouchContent(
  id: string,
  contentMd: string
): Promise<Touch | undefined> {
  const [row] = await getDb()
    .update(touches)
    .set({ contentMd, updatedAt: new Date() })
    .where(eq(touches.id, id))
    .returning()
  return row
}

export async function setTouchStatus(
  id: string,
  status: TouchStatus
): Promise<Touch | undefined> {
  const [row] = await getDb()
    .update(touches)
    .set({ status, updatedAt: new Date() })
    .where(eq(touches.id, id))
    .returning()
  return row
}

/**
 * Record Jamie's "I sent this" — the touch fact. Stamps the touch and the
 * client's last_touched_at (which un-stales the lead on /today). The send
 * itself happened off-platform, from Jamie's own email/WhatsApp.
 */
export async function logTouch(
  id: string,
  channel: string
): Promise<Touch | undefined> {
  const [row] = await getDb()
    .update(touches)
    .set({ loggedAt: new Date(), channel, updatedAt: new Date() })
    .where(eq(touches.id, id))
    .returning()
  if (row) await touchClient(row.clientId)
  return row
}

export async function deleteTouch(id: string): Promise<void> {
  await getDb().delete(touches).where(eq(touches.id, id))
}
