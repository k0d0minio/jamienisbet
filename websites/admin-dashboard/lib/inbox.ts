import "server-only"

import {
  CADENCE_STEPS,
  bestChannel,
  clientStatusLabel,
  countCracks,
  listClients,
  listDueOutreach,
  listTouchSummaries,
  listWokenNurture,
  touchChannelLabel,
  touchOutcomeLabel,
  type Client,
  type CrackCounts,
  type TouchSummary,
} from "@jamie-nisbet/services"

import { daysSince, formatShortDay, whatsappUrl } from "@/lib/format"
import type { InboxFact, InboxMore, InboxRow, ReachLink } from "@/lib/inbox-row"
import {
  daysWaiting,
  isNurtured,
  isProspect,
  isStale,
  prospectLabel,
  whoLabel,
} from "@/lib/leads"

// The Inbox's follow-ups (D-15), as a rule the queue and the rail's badge both
// read, so the number on the Inbox and the rows inside it count the same people.
// The badge is read when the shell renders (a load, a refresh, a server
// action); between those it can trail the queue on any other screen — never
// by a different rule. The Inbox screen itself keeps the badge exact while
// it is open (components/inbox-live-count.ts), from the same read.
//
// Three kinds: the outreach owed by today, open leads gone quiet past the
// staleness threshold, and the nurture wakes whose date has come. Each is
// capped, and the badge counts the capped rows — the number is what the screen
// shows, not what the database holds (D-30, which replaced D-25's uncapped
// count).

/** How many rows of each kind the queue shows. Ten outreach steps is a
 *  morning's work — the estate's daily ritual number; six quiet leads and three
 *  wakes are what a glance can decide. Past a cap the rest wait their turn:
 *  they take the freed places as rows are cleared. */
export const INBOX_CAPS = { outreach: 10, waiting: 6, wake: 3 } as const

/** A next step dated today or earlier — the lead is on the outreach queue. */
function isOnTodaysQueue(client: Client, now: number): boolean {
  if (client.nextActionDue === null) return false
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  return client.nextActionDue.getTime() <= endOfToday.getTime()
}

/**
 * Open leads past the staleness threshold, minus the ones already owed a step
 * today, longest wait first. A lead can be both stale *and* on the queue, and it
 * would be two rows about the same person: the queue wins that tie — "call
 * them back · 2 days late" is the work, and "waiting 9 days" is only the alarm
 * that goes off when nobody has decided.
 *
 * Prospects never appear: an imported business is not an open lead, so
 * `isStale` is false for the whole cold pool by construction.
 */
export function waitingOnYou(clients: Client[], now: number): Client[] {
  return clients
    .filter((client) => isStale(client, now) && !isOnTodaysQueue(client, now))
    .sort((a, b) => daysWaiting(b, now) - daysWaiting(a, now))
}

/** Every kind's full size — what the "N more" lines and the badge are
 *  computed from. */
function totals(
  clients: Client[],
  cracks: CrackCounts,
  now: number
): Record<keyof InboxMore, number> {
  return {
    outreach: cracks.due,
    waiting: waitingOnYou(clients, now).length,
    wake: cracks.woken,
  }
}

/** The rows the queue shows, summed: what the badge says. */
function shownCount(total: Record<keyof InboxMore, number>): number {
  return (
    Math.min(total.outreach, INBOX_CAPS.outreach) +
    Math.min(total.waiting, INBOX_CAPS.waiting) +
    Math.min(total.wake, INBOX_CAPS.wake)
  )
}

/**
 * How many rows the Inbox shows: the rail's and the tab bar's badge. Neon
 * only — two reads, cheap enough for every screen.
 *
 * Null when the database could not be read. It never rejects: it is streamed
 * into the shell as a promise, and a rejection there would take the shell's
 * error boundary with it for the sake of a badge.
 */
export async function countFollowUps(): Promise<number | null> {
  const now = Date.now()
  try {
    const [clients, cracks] = await Promise.all([
      listClients({ archived: false }),
      countCracks({ now: new Date(now) }),
    ])
    return shownCount(totals(clients, cracks, now))
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// The queue itself.

export type InboxRead =
  | { ok: true; rows: InboxRow[]; more: InboxMore }
  | { ok: false; error: string }

/**
 * The Inbox's one read: the three kinds as rows, in the order the group lists
 * them — outreach (the crack-finder's order: overdue first, then fit tier),
 * then the quiet leads (longest first), then the wakes (longest-overdue
 * first). The clock is read once, here, and every "how late" on the screen is
 * measured against it.
 */
export async function loadInbox(): Promise<InboxRead> {
  const now = Date.now()
  const at = new Date(now)
  try {
    const [clients, due, woken, cracks] = await Promise.all([
      listClients({ archived: false }),
      listDueOutreach({ now: at, limit: INBOX_CAPS.outreach }),
      listWokenNurture({ now: at, limit: INBOX_CAPS.wake }),
      countCracks({ now: at }),
    ])
    const waiting = waitingOnYou(clients, now).slice(0, INBOX_CAPS.waiting)
    const total = totals(clients, cracks, now)

    const leads = [...due, ...waiting, ...woken]
    const summaries = await listTouchSummaries(leads.map((lead) => lead.id))
    const summaryOf = (id: string) => summaries.find((s) => s.clientId === id)

    const rows: InboxRow[] = [
      ...due.map((c) => outreachRow(c, summaryOf(c.id), now)),
      ...waiting.map((c) => waitingRow(c, summaryOf(c.id), now)),
      ...woken.map((c) => wakeRow(c, summaryOf(c.id), now)),
    ]

    return {
      ok: true,
      rows,
      more: {
        outreach: Math.max(0, total.outreach - due.length),
        waiting: Math.max(0, total.waiting - waiting.length),
        wake: Math.max(0, total.wake - woken.length),
      },
    }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Could not reach the database.",
    }
  }
}

// ---- Rows ------------------------------------------------------------------

function outreachRow(
  client: Client,
  summary: TouchSummary | undefined,
  now: number
): InboxRow {
  const late = client.nextActionDue ? daysSince(client.nextActionDue, now) : 0
  const facts: InboxFact[] = [lastTouchFact(summary)]
  if (client.nextActionDue) {
    facts.push({ label: "Due", value: formatShortDay(client.nextActionDue) })
  }
  // The rung only means something on the cold cadence: a reply owed to
  // somebody who answered is a conversation, not step four of five.
  if (isProspect(client)) {
    const steps = CADENCE_STEPS.length
    const step = Math.min((summary?.outbound ?? 0) + 1, steps)
    facts.push({ label: "Cadence", value: `Step ${step} of ${steps}` })
  }
  const reach = reachLinks(client)
  return {
    key: `outreach:${client.id}`,
    kind: "outreach",
    id: client.id,
    name: client.name,
    who: whoLine(client),
    age: late > 0 ? `${late}d late` : "today",
    ageSpoken:
      late > 0 ? `${late} ${late === 1 ? "day" : "days"} late` : "Due today",
    late: late > 0,
    // A date can be set without a step ever being decided. That is a crack,
    // not a blank line, so it says so.
    text: client.nextAction
      ? `Next step: ${client.nextAction}.`
      : "A date is set but no step was decided — open them and decide.",
    facts,
    reach,
    logChannel: reach[0]?.channel ?? bestChannel(client) ?? "other",
    hasStep: client.nextAction !== null,
  }
}

function waitingRow(
  client: Client,
  summary: TouchSummary | undefined,
  now: number
): InboxRow {
  const days = daysWaiting(client, now)
  const facts: InboxFact[] = [
    { label: "Status", value: clientStatusLabel(client.status) },
    { label: "Received", value: formatShortDay(client.createdAt) },
    lastTouchFact(summary),
  ]
  if (client.intakeMessage) {
    facts.push({ label: "Intake", value: `“${clip(client.intakeMessage)}”` })
  }
  const reach = reachLinks(client)
  return {
    key: `waiting:${client.id}`,
    kind: "waiting",
    id: client.id,
    name: client.name,
    who: whoLine(client),
    age: `${days}d`,
    ageSpoken: `Waiting ${days} ${days === 1 ? "day" : "days"}`,
    late: true,
    // A stale lead can carry a step dated later than today — the row is here
    // because nothing has moved, and the plan is worth reading beside that.
    text: client.nextAction
      ? `Untouched for ${days} days. Next step: ${client.nextAction}${
          client.nextActionDue ? ` · ${formatShortDay(client.nextActionDue)}` : ""
        }.`
      : `Untouched for ${days} days. Nothing is planned next.`,
    facts,
    reach,
    logChannel: reach[0]?.channel ?? "other",
    hasStep: client.nextAction !== null,
  }
}

function wakeRow(
  client: Client,
  summary: TouchSummary | undefined,
  now: number
): InboxRow {
  const late = client.wakeAt ? daysSince(client.wakeAt, now) : 0
  const facts: InboxFact[] = [
    { label: "Wake date", value: formatShortDay(client.wakeAt) },
    lastTouchFact(summary),
  ]
  const reach = reachLinks(client)
  return {
    key: `wake:${client.id}`,
    kind: "wake",
    id: client.id,
    name: client.name,
    who: whoLine(client),
    age: late > 0 ? `${late}d` : "today",
    ageSpoken:
      late > 0
        ? `Woke ${late} ${late === 1 ? "day" : "days"} ago`
        : "Wakes today",
    late: false,
    text: `Parked until ${formatShortDay(client.wakeAt)}. Wake them back to prospect with a step due today — they return as an outreach row — or push the wake.`,
    facts,
    reach,
    logChannel: reach[0]?.channel ?? "other",
    hasStep: true,
  }
}

/** Who or where, in the words the rows have always used: what a prospect is
 *  (sector and town), and otherwise where the lead sits and who they are. */
function whoLine(client: Client): string | null {
  if (isProspect(client) || isNurtured(client)) return prospectLabel(client)
  const who = whoLabel(client)
  return [clientStatusLabel(client.status), who].filter(Boolean).join(" · ")
}

function lastTouchFact(summary: TouchSummary | undefined): InboxFact {
  const last = summary?.last
  if (!last) return { label: "Last touch", value: "None yet" }
  return {
    label: "Last touch",
    value: [
      touchChannelLabel(last.channel),
      last.direction === "in" ? "in" : null,
      touchOutcomeLabel(last.outcome),
      formatShortDay(last.loggedAt),
    ]
      .filter(Boolean)
      .join(" · "),
  }
}

/**
 * The doors the Inbox opens, the cadence's best one first: WhatsApp, email
 * and the phone — plain `wa.me`, `mailto:` and `tel:` links, nothing more
 * (D-33). A walk-in or an Instagram DM is worked from the lead's profile, so a
 * lead reachable only there has no reach links here and the row offers the
 * profile instead.
 */
function reachLinks(client: Client): ReachLink[] {
  const links: ReachLink[] = []
  const chat = client.whatsapp ?? client.phone
  if (chat) {
    links.push({
      channel: "whatsapp",
      label: "WhatsApp",
      href: whatsappUrl(chat),
      external: true,
    })
  }
  if (client.email) {
    links.push({
      channel: "email",
      label: "Email",
      href: `mailto:${client.email}`,
      external: false,
    })
  }
  if (client.phone) {
    links.push({
      channel: "phone",
      label: "Call",
      href: `tel:${client.phone.replace(/[^\d+]/g, "")}`,
      external: false,
    })
  }
  const best = bestChannel(client)
  const first = links.findIndex((link) => link.channel === best)
  if (first > 0) links.unshift(...links.splice(first, 1))
  return links
}

/** An intake message at fact length. */
function clip(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}
