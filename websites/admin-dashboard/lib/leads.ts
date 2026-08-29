import {
  activeStatuses,
  customerStatuses,
  openStatuses,
  pastStatuses,
  type Client,
} from "@jamie-nisbet/services"

import { daysSince, waitingLabel } from "@/lib/format"
import { formatMoney } from "@/lib/money"

// How a lead reads on a row, in one place. The Leads list and the Needs you
// feed both render leads and both have to agree on when one has gone quiet —
// the feed's whole first section is "the ones past the threshold", and a
// threshold that drifted between the two screens would have the feed calling
// for a lead the list wasn't flagging.

/** A lead nobody has touched in this long is overdue a nudge. */
export const STALE_AFTER_DAYS = 7

/** Days since the lead was last worked — intake counts as the first touch. */
export function daysWaiting(client: Client, now: number): number {
  return daysSince(client.lastTouchedAt ?? client.createdAt, now)
}

export function isOpenLead(client: Client): boolean {
  return (openStatuses as readonly string[]).includes(client.status)
}

export function isCustomer(client: Client): boolean {
  return (customerStatuses as readonly string[]).includes(client.status)
}

/** The engagement is on: the only status the monthly and in-kind totals count. */
export function isActiveClient(client: Client): boolean {
  return (activeStatuses as readonly string[]).includes(client.status)
}

/** The engagement is over but the relationship is kept — listed under Clients,
 *  muted, and never part of a money figure or a staleness nudge. */
export function isPastClient(client: Client): boolean {
  return (pastStatuses as readonly string[]).includes(client.status)
}

/** Only an open lead can be "waiting" — a client, a past client or a lost one
 *  isn't owed a reply. */
export function isStale(client: Client, now: number): boolean {
  return isOpenLead(client) && daysWaiting(client, now) >= STALE_AFTER_DAYS
}

/** Who they are, in the two or three words the second line has room for: the
 *  company when there is one, and otherwise where they came from — but only
 *  when that says something. "Referral" and "Contact" are provenance worth
 *  reading on every row; "Manual" only means Jamie typed them in, which is the
 *  default and not news, so a hand-added lead with no company simply carries
 *  the waiting line alone. */
export function whoLabel(client: Client): string | null {
  if (client.company) return client.company
  if (client.source === "portfolio") return "Contact"
  if (client.source === "referral") return "Referral"
  return null
}

/** What a lead is worth, rendered so a retainer never reads as a one-off. */
export function valueLabel(client: Client): string | null {
  if (client.valueMinor <= 0) return null
  const amount = formatMoney(client.valueMinor, "eur")
  return client.billingType === "monthly" ? `${amount}/mo` : amount
}

/** The leading line of a row — what the Leads list is sorted on. A client, a
 *  past client or a lost lead isn't waiting on anything, so it just reports
 *  when it last moved. */
export function waitedLabel(days: number, open: boolean): string {
  if (days <= 0) return "Worked today"
  const elapsed = waitingLabel(days)
  return open ? `Waiting ${elapsed}` : `Last worked ${elapsed} ago`
}
