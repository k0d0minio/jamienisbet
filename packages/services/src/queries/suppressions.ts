import { and, desc, eq, or, sql } from "drizzle-orm"

import { getDb } from "../client"
import { clients, suppressions } from "../schema"
import type { Client } from "./clients"
import { logTouch } from "./touches"

// The legal floor under the whole lead engine, and the one part of it that is
// written before the pool is imported rather than after.
//
// Everything else in this layer is about reaching people. This is the file
// that knows who must never be reached again, and it is deliberately the
// simplest thing here: a set of contact points, keyed by the point itself
// rather than by the lead it came from, so an opt-out outlives the row it was
// asked through — the archive, the delete, the retention purge, and next
// spring's re-import of the same business from a fresh list.
//
// Two ideas do all the work:
//
//   1. **Normalize on the way in.** "Geral@Example.PT" and "geral@example.pt"
//      are one opt-out; "912 345 678" and "+351 912 345 678" are one number.
//      Every read and every write goes through `normalizeSuppressionValue`, so
//      the comparison is an indexed equality rather than a guess.
//   2. **Never delete.** Nothing in this package removes a suppression. That
//      is a decision, not an omission — see `suppressContactPoints`.

export type Suppression = typeof suppressions.$inferSelect

// ---- The vocabulary ---------------------------------------------------------
// Same shape as the status ladder and the touch channels: an ordered set, a
// label lookup beside it, and a guard for the value coming off a form. Stored
// as a plain varchar, so this file is the only thing keeping it closed.

/**
 * Which kind of contact point an opt-out covers.
 *
 * Three, not five. A suppression needs something you can hold onto and compare
 * — a walk-in has no identifier at all, and WhatsApp is not its own kind
 * because it is a phone number arriving through a second door: suppressing the
 * number closes the call and the chat together, which is what somebody who
 * asked to be left alone actually meant.
 */
export const suppressionKinds = ["email", "phone", "instagram"] as const
export type SuppressionKind = (typeof suppressionKinds)[number]

export const suppressionKindLabels: Record<SuppressionKind, string> = {
  email: "Email",
  phone: "Phone",
  instagram: "Instagram",
}

/** The one lookup that turns a stored kind into UI text. An unrecognised value
 *  falls through to itself, so a row written before this list changed still
 *  names itself rather than disappearing. */
export function suppressionKindLabel(value: string): string {
  return suppressionKindLabels[value as SuppressionKind] ?? value
}

export function isSuppressionKind(value: string): value is SuppressionKind {
  return (suppressionKinds as readonly string[]).includes(value)
}

// ---- Normalization ----------------------------------------------------------

/** Portugal. The pool is Mafra, Ericeira and greater Lisbon, so a bare
 *  nine-digit number is a Portuguese one — which is the only assumption in
 *  this file, and it is written down here rather than implied in three places. */
export const DEFAULT_COUNTRY_CODE = "351"

/**
 * A phone number as E.164 — `+351912345678` — or null if there are no digits
 * in it at all.
 *
 * The canonical form for anything that has to *compare* two numbers, which is
 * this table's whole job: the pool's numbers arrive written the way people
 * write them down, and "+351 912 345 678", "00351912345678" and "912345678"
 * are one business either way. The rule is the same one the dashboard's
 * `whatsappUrl` uses to build a wa.me link (websites/admin-dashboard/lib/format.ts)
 * — that copy stays there because it is a presentation helper imported by
 * client components, which never pull this package into the browser bundle.
 *
 * A number that is already international is trusted as it stands: only a bare
 * nine-digit national number gets a country code put in front of it.
 */
export function toE164(raw: string): string | null {
  const trimmed = raw.trim()
  let digits = trimmed.replace(/\D/g, "")
  if (digits === "") return null

  if (trimmed.startsWith("+")) {
    // Already international — the digits are complete.
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2)
  } else if (digits.length === 9) {
    digits = `${DEFAULT_COUNTRY_CODE}${digits}`
  }
  return `+${digits}`
}

/**
 * A contact point in the form this table stores and compares it in, or null if
 * there is nothing there to suppress.
 *
 * Every door into this file goes through here — the checks as much as the
 * writes — because a suppression that is stored normalized and looked up raw
 * is a suppression that silently does nothing.
 */
export function normalizeSuppressionValue(
  kind: SuppressionKind,
  raw: string | null | undefined
): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed === "") return null

  switch (kind) {
    case "email":
      // Case is not part of an address for any mail server that matters, and
      // the pool's role addresses arrive capitalised as often as not.
      return trimmed.toLowerCase().slice(0, 200)
    case "phone":
      return toE164(trimmed)?.slice(0, 200) ?? null
    case "instagram":
      // Stored bare and lowercase, the same way `clients.instagram` is: the
      // '@' is punctuation and handles are case-insensitive.
      return trimmed.replace(/^@+/, "").toLowerCase().slice(0, 200) || null
  }
}

// ---- Contact points ---------------------------------------------------------

/** One suppressible way of reaching somebody, already normalized. */
export type ContactPoint = { kind: SuppressionKind; value: string }

/** The columns a contact point can come from — structural, so a whole `Client`
 *  row, a list projection and an import script's draft can all be asked the
 *  same question. */
export type SuppressibleContact = Pick<
  Client,
  "email" | "phone" | "whatsapp" | "instagram"
>

/**
 * Every way this lead can currently be reached, normalized and de-duplicated.
 *
 * The de-duplication is the reason this exists rather than three inline calls:
 * for most of the pool `whatsapp` is null and the chat *is* the phone number,
 * and for the rest the two numbers are different lines that both need closing.
 * Either way the caller wants the set, not the columns.
 */
export function contactPointsOf(client: SuppressibleContact): ContactPoint[] {
  const raw: ContactPoint[] = []
  for (const [kind, value] of [
    ["email", client.email],
    ["phone", client.phone],
    ["phone", client.whatsapp],
    ["instagram", client.instagram],
  ] as const) {
    const normalized = normalizeSuppressionValue(kind, value)
    if (normalized) raw.push({ kind, value: normalized })
  }

  const seen = new Set<string>()
  return raw.filter((point) => {
    const key = `${point.kind}:${point.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---- Reads ------------------------------------------------------------------

/**
 * Has this one contact point opted out?
 *
 * The check the import script runs at the door (sequence 4) and the one any
 * single-channel handoff asks before it offers a send gesture. Takes a raw
 * value and normalizes it here, so no caller has to remember to.
 */
export async function isSuppressed(
  kind: SuppressionKind,
  rawValue: string | null | undefined
): Promise<boolean> {
  const value = normalizeSuppressionValue(kind, rawValue)
  if (!value) return false
  const [row] = await getDb()
    .select({ id: suppressions.id })
    .from(suppressions)
    .where(and(eq(suppressions.kind, kind), eq(suppressions.value, value)))
    .limit(1)
  return row !== undefined
}

/**
 * Which of these contact points have opted out — one round trip for a whole
 * lead, or for a whole batch of them.
 *
 * The surfaces that honour a suppression are rendering a page, not asking a
 * yes/no question: the profile needs to know which of four rows is a dead end
 * before it draws any of them, and the queue (sequence 6) needs the same
 * answer for every lead it lists. Both would otherwise be a query per channel.
 *
 * Returns the matching rows rather than a boolean, because the row carries the
 * `reason` and the date, which is what a dead-end state has to say for itself.
 */
export async function findSuppressions(
  points: readonly ContactPoint[]
): Promise<Suppression[]> {
  if (points.length === 0) return []
  return getDb()
    .select()
    .from(suppressions)
    .where(
      or(
        ...points.map((point) =>
          and(
            eq(suppressions.kind, point.kind),
            eq(suppressions.value, point.value)
          )
        )
      )
    )
}

/** The same question asked of a lead: which of *their* channels are closed.
 *  What the lead profile reads before it renders a contact row or an action
 *  disc. */
export async function suppressionsForClient(
  client: SuppressibleContact
): Promise<Suppression[]> {
  return findSuppressions(contactPointsOf(client))
}

/** The whole list, newest opt-out first — the operator scripts' read (sequence
 *  4), and the only way to see this table from outside psql. Capped, because
 *  nothing that reads it wants every row of a table that only grows. */
export async function listSuppressions(limit = 200): Promise<Suppression[]> {
  return getDb()
    .select()
    .from(suppressions)
    .orderBy(desc(suppressions.createdAt), desc(suppressions.id))
    .limit(limit)
}

/** How many contact points are closed, all-time. */
export async function countSuppressions(): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(suppressions)
  return row?.count ?? 0
}

// ---- Writes -----------------------------------------------------------------

/**
 * Record an opt-out against these contact points.
 *
 * Idempotent by construction: a second opt-out through the same channel is the
 * same opt-out, so a conflict on (kind, value) is a no-op rather than an
 * update. That keeps `created_at` the date it was *first* asked for, which is
 * the date that matters if anyone ever asks how long a request took to honour,
 * and it means the import script can call this without checking first.
 *
 * **There is deliberately no counterpart that deletes one.** An opt-out has to
 * be permanent to be worth anything — a table you can un-tick is a table the
 * next import quietly walks past — and a delete button on a legal record is
 * the one button whose accidental press is a compliance problem rather than a
 * data problem. A row entered by a fat thumb is a `DELETE` in psql, on
 * purpose: rare, deliberate, and nowhere near a phone.
 *
 * Returns the rows that were actually inserted, which is how a caller knows
 * whether it just closed a channel or found one already closed.
 */
export async function suppressContactPoints(
  points: readonly ContactPoint[],
  reason?: string | null
): Promise<Suppression[]> {
  if (points.length === 0) return []
  return getDb()
    .insert(suppressions)
    .values(
      points.map((point) => ({
        kind: point.kind,
        value: point.value,
        reason: reason?.trim().slice(0, 200) || null,
      }))
    )
    .onConflictDoNothing({
      target: [suppressions.kind, suppressions.value],
    })
    .returning()
}

/** What the suppress gesture did, so the surface that fired it can say so. */
export type SuppressClientResult = {
  /** The lead as it now stands — terminal, with nothing planned. */
  client: Client
  /** Every channel this closed, including the ones that were already closed:
   *  the answer to "who can still be contacted here" is now "none of these". */
  points: ContactPoint[]
}

/**
 * The whole opt-out gesture: they asked to be left alone, so close every
 * channel, end the relationship, and say in the history why it ended.
 *
 * One call rather than four writes at the call site, for the same reason
 * `parkClient` is one call: it is a single decision, and a surface that got
 * three of the four right would leave a lead who has opted out sitting in
 * tomorrow's outreach queue. Sequence 4's operator scripts get the same
 * behaviour for free by calling the same function.
 *
 * Four things happen, in the order they matter:
 *
 *   1. **The contact points are suppressed** — permanently, and outside this
 *      lead's row, so a re-import of the same business next spring skips them.
 *   2. **A touch is logged**: inbound, `not_interested`, carrying the reason.
 *      An opt-out *is* contact — it is the last thing that happened with this
 *      relationship, and a history that doesn't say so leaves the profile
 *      looking like a lead that was simply dropped. It is also what makes the
 *      cadence stop on its own: `suggestNextTouch` returns null after a no.
 *   3. **The lead moves to `not_won`** — terminal, which is what a request to
 *      be left alone means for the relationship.
 *   4. **Nothing is planned any more**: the next action, its date and any wake
 *      date are cleared, because a plan on a suppressed lead is precisely the
 *      row that would come back tomorrow.
 *
 * The record itself is kept, not deleted. Somebody who opted out and then gets
 * imported again should read as "this is the business that asked to be left
 * alone", not as a blank a fresh cadence starts against — and the retention
 * rule (`.icm/docs/lia-cold-outreach.md`) is what eventually clears the
 * contact details, leaving the suppression standing.
 *
 * Undefined if the lead no longer exists; nothing is written in that case.
 */
export async function suppressClient(
  id: string,
  reason?: string | null
): Promise<SuppressClientResult | undefined> {
  const [client] = await getDb().select().from(clients).where(eq(clients.id, id))
  if (!client) return undefined

  const points = contactPointsOf(client)
  const note = reason?.trim().slice(0, 200) || null

  await suppressContactPoints(points, note)

  await logTouch({
    clientId: id,
    // The door they came through isn't knowable here — a "remove me" arrives
    // by reply, by phone, or in person — so the touch says what happened
    // rather than guessing where. The reason, when there is one, says where.
    channel: "other",
    direction: "in",
    outcome: "not_interested",
    note: note ?? "Asked not to be contacted again.",
  })

  const [row] = await getDb()
    .update(clients)
    .set({
      status: "not_won",
      nextAction: null,
      nextActionDue: null,
      wakeAt: null,
      lastTouchedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning()

  return { client: row, points }
}
