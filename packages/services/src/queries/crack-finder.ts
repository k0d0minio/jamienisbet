import { and, asc, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm"

import { getDb } from "../client"
import { clients } from "../schema"
import { nextActionStatuses, nurtureStatuses, type Client } from "./clients"

// The crack-finder — the reads that notice what the writes never refuse.
//
// The invariant this system runs on is *no open lead without a next action and
// a date*, and it is enforced by nobody: a save is never blocked for a missing
// next action (Jamie's decision 7). That is a deliberate trade. A form that
// refuses to close until you have decided what happens next is a form you stop
// opening, and a cadence you stop logging is worth less than a gap you can see.
//
// So the invariant lives here instead, as four questions asked of the table:
//
//   1. What is owed today?          listDueOutreach
//   2. What has nothing planned?    listWithoutNextAction
//   3. Who has woken up?            listWokenNurture
//   4. What conversation went cold? listIdleEngaged
//
// Sequence 6 of the lead-engine epic renders them on the Needs you feed;
// the operator scripts in ../../scripts/ read the same four functions, which is the
// point of them being here rather than in a page.
//
// All four exclude archived rows and all four return whole `Client` rows: the
// surfaces that show a crack show a lead, and a projection would only mean a
// second read to render one.

/**
 * How long a live conversation may go quiet before it counts as a crack.
 *
 * Deliberately longer than the leads list's `STALE_AFTER_DAYS` (7), which
 * measures something else: that one is "somebody arrived and nobody has
 * replied", which is rude at a week. This is "we are mid-conversation and it
 * stopped", where a fortnight is the point at which a deal is cooling rather
 * than a person waiting.
 */
export const IDLE_AFTER_DAYS = 14

/** Common to every question here: the row is still on the books. */
const live = isNull(clients.archivedAt)

/** The end of `now`'s day, which is what "due today" means. Computed from the
 *  clock the caller passed rather than the database's, so a page and a script
 *  reading at the same moment agree on where today ends. */
function endOfDay(now: Date): Date {
  const at = new Date(now.getTime())
  at.setHours(23, 59, 59, 999)
  return at
}

/**
 * 1. What is owed today — the daily outreach queue.
 *
 * Everything on a cadence rung whose next action falls due today or has
 * already passed. Ordered the way the breakdown asks: overdue first, then by
 * fit tier, then by how long it has been due. An untiered row sorts after C
 * rather than before A — nobody has graded it, which is not the same as
 * grading it badly.
 *
 * `limit` because this is a queue, not a report: the estate's daily ritual
 * caps at ten, and a list of sixty is a list nobody works.
 */
export async function listDueOutreach(
  opts: { now?: Date; limit?: number } = {}
): Promise<Client[]> {
  const now = opts.now ?? new Date()
  const query = getDb()
    .select()
    .from(clients)
    .where(
      and(
        live,
        inArray(clients.status, [...nextActionStatuses]),
        isNotNull(clients.nextActionDue),
        lte(clients.nextActionDue, endOfDay(now))
      )
    )
    .orderBy(
      // Overdue before due-today. A boolean sorts false-then-true ascending,
      // so this is the one that needs saying backwards.
      sql`(${clients.nextActionDue} < ${now}) desc`,
      sql`${clients.fitTier} asc nulls last`,
      asc(clients.nextActionDue)
    )
  return opts.limit ? query.limit(opts.limit) : query
}

/**
 * 2. What has nothing planned — the gap the gentle rule leaves behind.
 *
 * A lead or a prospect being worked with no next action, or with one that has
 * no date on it. Both are the same crack: an action with no due date never
 * reaches the queue above, so it is a decision that was made and then lost.
 *
 * Ordered by tier, then longest-waiting — the same "who has been ignored
 * longest" sort the leads list opens on, applied to the rows that aren't even
 * on the board.
 */
export async function listWithoutNextAction(
  opts: { limit?: number } = {}
): Promise<Client[]> {
  const query = getDb()
    .select()
    .from(clients)
    .where(
      and(
        live,
        inArray(clients.status, [...nextActionStatuses]),
        or(isNull(clients.nextAction), isNull(clients.nextActionDue))
      )
    )
    .orderBy(
      sql`${clients.fitTier} asc nulls last`,
      asc(sql`coalesce(${clients.lastTouchedAt}, ${clients.createdAt})`)
    )
  return opts.limit ? query.limit(opts.limit) : query
}

/**
 * 3. Who has woken up — parked relationships whose date has come.
 *
 * A nurture row is the one rung that is deliberately doing nothing, and
 * `wake_at` is the promise that it will stop. Without this query the promise
 * is a column nobody reads, which is how a parked lead becomes a lost one.
 *
 * Longest-overdue wake first: a date that passed in March matters more than
 * one that passed yesterday.
 */
export async function listWokenNurture(
  opts: { now?: Date; limit?: number } = {}
): Promise<Client[]> {
  const now = opts.now ?? new Date()
  const query = getDb()
    .select()
    .from(clients)
    .where(
      and(
        live,
        inArray(clients.status, [...nurtureStatuses]),
        isNotNull(clients.wakeAt),
        lte(clients.wakeAt, now)
      )
    )
    .orderBy(asc(clients.wakeAt))
  return opts.limit ? query.limit(opts.limit) : query
}

/**
 * 4. What conversation went cold — a live discussion nobody has worked in
 * `days` days.
 *
 * This is the expensive crack: a lead that answered, got quoted, and then fell
 * off the end of a week. It is measured on `last_touched_at` rather than on
 * the touch log, because a status change or a profile edit is work on the
 * relationship too, and the question here is "has anything happened", not
 * "was a message sent".
 */
export async function listIdleEngaged(
  opts: { now?: Date; days?: number; limit?: number } = {}
): Promise<Client[]> {
  const now = opts.now ?? new Date()
  const days = opts.days ?? IDLE_AFTER_DAYS
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const query = getDb()
    .select()
    .from(clients)
    .where(
      and(
        live,
        // The one rung that means "we are talking". `lead` is not here: an
        // unanswered arrival is the leads list's staleness nag, not a
        // conversation that stopped.
        inArray(clients.status, ["discussing"]),
        lt(sql`coalesce(${clients.lastTouchedAt}, ${clients.createdAt})`, cutoff)
      )
    )
    .orderBy(asc(sql`coalesce(${clients.lastTouchedAt}, ${clients.createdAt})`))
  return opts.limit ? query.limit(opts.limit) : query
}

/** Every crack at once, keyed by which one it is. Four independent reads, so
 *  they go together rather than in series — this is what a feed or a script
 *  wants, and running them one at a time would be four round trips to Neon for
 *  one screen. */
export type Cracks = {
  /** Owed today or already overdue. */
  due: Client[]
  /** Being worked, with nothing planned. */
  unplanned: Client[]
  /** Parked, and the date has come. */
  woken: Client[]
  /** Mid-conversation, and quiet too long. */
  idle: Client[]
}

export async function findCracks(
  opts: { now?: Date; days?: number; limit?: number } = {}
): Promise<Cracks> {
  const now = opts.now ?? new Date()
  const [due, unplanned, woken, idle] = await Promise.all([
    listDueOutreach({ now, limit: opts.limit }),
    listWithoutNextAction({ limit: opts.limit }),
    listWokenNurture({ now, limit: opts.limit }),
    listIdleEngaged({ now, days: opts.days, limit: opts.limit }),
  ])
  return { due, unplanned, woken, idle }
}
