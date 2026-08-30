import { and, desc, eq, sql } from "drizzle-orm"

import { getDb } from "../client"
import { clients, touches } from "../schema"

export type Touch = typeof touches.$inferSelect
export type NewTouch = typeof touches.$inferInsert

// ---- The three vocabularies -------------------------------------------------
// Same shape as the status ladder and the cold pool's facts: an ordered set, a
// label lookup beside it, and a guard for the value coming off a form. Stored
// as plain varchars, so this file is the only thing that keeps them closed —
// nothing at the database level would catch a channel the app doesn't name.

/**
 * How a touch happened.
 *
 * Five first-class channels and a catch-all, because Portugal shapes the list:
 * a local SMB in Mafra is reached by walking in as often as by email, and
 * WhatsApp is a front door rather than a fallback. `other` exists so a touch
 * that happened somewhere odd (a LinkedIn message, a mutual friend) is still
 * logged rather than not logged.
 *
 * The order is the order the log sheet offers them, which is the order they are
 * actually used on this pool — chat first, the phone second, the door third.
 */
export const touchChannels = [
  "whatsapp",
  "phone",
  "email",
  "walkin",
  "instagram",
  "other",
] as const
export type TouchChannel = (typeof touchChannels)[number]

export const touchChannelLabels: Record<TouchChannel, string> = {
  whatsapp: "WhatsApp",
  phone: "Phone",
  email: "Email",
  walkin: "Walk-in",
  instagram: "Instagram",
  other: "Other",
}

/** The one lookup that turns a stored channel into UI text. An unrecognised
 *  value falls through to itself, so a row written before this list changed
 *  still names itself rather than disappearing. */
export function touchChannelLabel(value: string): string {
  return touchChannelLabels[value as TouchChannel] ?? value
}

export function isTouchChannel(value: string): value is TouchChannel {
  return (touchChannels as readonly string[]).includes(value)
}

/** Who started it. Outbound is the ordinary case and the default; inbound is
 *  the one worth marking, because a lead that reaches out has engaged and the
 *  cadence should stop pushing. */
export const touchDirections = ["out", "in"] as const
export type TouchDirection = (typeof touchDirections)[number]

export const touchDirectionLabels: Record<TouchDirection, string> = {
  out: "Out",
  in: "In",
}

export function isTouchDirection(value: string): value is TouchDirection {
  return (touchDirections as readonly string[]).includes(value)
}

/**
 * What came of it — seven words, and the vocabulary the cadence reads.
 *
 * They are not a ladder and they do not overlap: `sent` is "it went, nothing
 * came back yet" (an email, a DM, a voicemail-free unanswered nothing);
 * `no_answer` is a call that rang out; `callback` is "they asked me to try
 * later"; `answered` is a conversation that happened on the phone or at the
 * door; `replied` is a written answer; `met` is a real meeting; and
 * `not_interested` is a no.
 *
 * Three of them mean the relationship has engaged (`answered`, `replied`,
 * `met`), which is what stops the cadence pushing and starts it suggesting a
 * reply instead — see `suggestNextTouch` in ../cadence.
 */
export const touchOutcomes = [
  "sent",
  "no_answer",
  "callback",
  "answered",
  "replied",
  "met",
  "not_interested",
] as const
export type TouchOutcome = (typeof touchOutcomes)[number]

export const touchOutcomeLabels: Record<TouchOutcome, string> = {
  sent: "Sent",
  no_answer: "No answer",
  callback: "Call back",
  answered: "Answered",
  replied: "Replied",
  met: "Met",
  not_interested: "Not interested",
}

export function touchOutcomeLabel(value: string): string {
  return touchOutcomeLabels[value as TouchOutcome] ?? value
}

export function isTouchOutcome(value: string): value is TouchOutcome {
  return (touchOutcomes as readonly string[]).includes(value)
}

/** The outcomes that mean this relationship is no longer cold: they said
 *  something back. A cadence stops pushing at the first one of these. */
export const engagedOutcomes: readonly TouchOutcome[] = [
  "answered",
  "replied",
  "met",
]

export function isEngagedOutcome(value: string): boolean {
  return (engagedOutcomes as readonly string[]).includes(value)
}

// ---- Reads ------------------------------------------------------------------

/**
 * One client's history, newest first — what the lead profile's Work tab reads.
 *
 * Capped by default: a prospect that ran a full cadence has five or six rows,
 * and a client three years in could have hundreds. The profile wants the
 * recent story, not the archive.
 */
export async function listTouchesForClient(
  clientId: string,
  limit = 25
): Promise<Touch[]> {
  return getDb()
    .select()
    .from(touches)
    .where(eq(touches.clientId, clientId))
    .orderBy(desc(touches.loggedAt), desc(touches.id))
    .limit(limit)
}

/** How many touches this client has, all-time — the number the history's
 *  footer reports when the list above it is capped, and what the cadence
 *  counts steps with. */
export async function countTouchesForClient(clientId: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(touches)
    .where(eq(touches.clientId, clientId))
  return row?.count ?? 0
}

/** The last outbound touch on a client, or undefined if nobody has reached out
 *  yet. What the cadence measures its next due date from. */
export async function lastOutboundTouch(
  clientId: string
): Promise<Touch | undefined> {
  const [row] = await getDb()
    .select()
    .from(touches)
    .where(and(eq(touches.clientId, clientId), eq(touches.direction, "out")))
    .orderBy(desc(touches.loggedAt), desc(touches.id))
    .limit(1)
  return row
}

// ---- Writes -----------------------------------------------------------------

export type TouchInput = {
  clientId: string
  channel: TouchChannel
  /** Defaults to outbound — the ordinary case. */
  direction?: TouchDirection
  outcome: TouchOutcome
  note?: string | null
  /** The draft that was used, if any (sequence 5 fills this). */
  draftMd?: string | null
  /** Which model drafted it — a courtesy field, not spend tracking. */
  model?: string | null
  /** When it happened, if that is not now — a call on the road, typed in that
   *  evening. */
  loggedAt?: Date
}

/**
 * Record a touch, and stamp the relationship as worked.
 *
 * The stamp is the point of doing this here rather than in two calls at the
 * call site: logging a touch *is* the canonical "I worked this one", and every
 * other mutation in this layer already moves `last_touched_at` (a status
 * change, a profile edit, "Mark touched"). A history row that left the lead
 * looking untouched would put them straight back at the top of the staleness
 * sort they just came off.
 *
 * Two statements rather than one transaction: the Neon HTTP driver has no
 * multi-statement transaction, and the failure mode is benign either way — a
 * stamp without a row is what "Mark touched" already writes, and a row without
 * a stamp is a history entry the next touch's stamp corrects.
 */
export async function logTouch(input: TouchInput): Promise<Touch> {
  const at = input.loggedAt ?? new Date()
  const [row] = await getDb()
    .insert(touches)
    .values({
      clientId: input.clientId,
      channel: input.channel,
      direction: input.direction ?? "out",
      outcome: input.outcome,
      note: input.note ?? null,
      draftMd: input.draftMd ?? null,
      model: input.model ?? null,
      loggedAt: at,
    })
    .returning()

  // Never move the stamp backwards: a touch back-dated to last Tuesday is
  // history being filled in, not the relationship going quiet again.
  await getDb()
    .update(clients)
    .set({
      lastTouchedAt: sql`greatest(coalesce(${clients.lastTouchedAt}, ${at.toISOString()}::timestamptz), ${at.toISOString()}::timestamptz)`,
    })
    .where(eq(clients.id, input.clientId))

  return row
}

/**
 * Drop a touch — the one write that isn't an append, for the row logged
 * against the wrong person or with the wrong channel under a moving thumb.
 * `last_touched_at` is deliberately left where it is: it is a stamp, not a
 * derived figure, and recomputing it from the remaining history would undo
 * every "Mark touched" that ever happened alongside one.
 */
export async function deleteTouch(id: string): Promise<void> {
  await getDb().delete(touches).where(eq(touches.id, id))
}
