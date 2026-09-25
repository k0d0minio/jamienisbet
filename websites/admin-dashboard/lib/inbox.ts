import "server-only"

import { countCracks, listClients, type Client } from "@jamie-nisbet/services"

import { isStale } from "@/lib/leads"

// The Inbox's follow-ups (D-15), as a rule the feed and the rail's badge both
// read, so the number on the Inbox and the rows inside it can never disagree
// about who is waiting.
//
// Three kinds: open leads gone quiet past the staleness threshold, the outreach
// owed by today, and the nurture wakes whose date has come. Money and today's
// tickets are not follow-ups — they leave the Inbox with inbox-rebuild, and the
// badge never counted them (decision D-25 of the shell-rail-palette run).

/** A next step dated today or earlier — the lead is on the outreach queue. */
function isOnTodaysQueue(client: Client, now: number): boolean {
  if (client.nextActionDue === null) return false
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  return client.nextActionDue.getTime() <= endOfToday.getTime()
}

/**
 * Open leads past the staleness threshold, minus the ones already owed a step
 * today. A lead can be both stale *and* on the queue, and it would be two rows
 * about the same person: the queue wins that tie — "call them back · 2 days
 * late" is the work, and "waiting 9 days" is only the alarm that goes off when
 * nobody has decided. Order is preserved, so a list sorted by who has waited
 * longest stays that way.
 *
 * Prospects never appear: an imported business is not an open lead, so
 * `isStale` is false for the whole cold pool by construction.
 */
export function waitingOnYou(clients: Client[], now: number): Client[] {
  return clients.filter(
    (client) => isStale(client, now) && !isOnTodaysQueue(client, now)
  )
}

/**
 * How many follow-ups are waiting, uncapped: the rail's and the tab bar's
 * Inbox badge. Neon only — two reads, cheap enough for every screen.
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
    return waitingOnYou(clients, now).length + cracks.due + cracks.woken
  } catch {
    return null
  }
}
