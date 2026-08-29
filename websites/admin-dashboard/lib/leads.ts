import {
  activeStatuses,
  customerStatuses,
  dealHeadline,
  openStatuses,
  pastStatuses,
  type Client,
  type DealComponentKind,
  type DealTerms,
} from "@jamie-nisbet/services"

import { daysSince, waitingLabel } from "@/lib/format"
import { formatMoney } from "@/lib/money"
import { formatBps } from "@/lib/percent"

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

/** The one figure that qualifies a deal, in the two shapes the two surfaces
 *  that show it need. */
export type DealFigure = {
  /** Which component the figure came from — what a caller omits from the
   *  badges beside it, so the row doesn't say "equity" twice. */
  kind: DealComponentKind
  /** The figure alone, for a surface that captions it — the profile masthead,
   *  where `label` sits above it. */
  value: string
  /** What the figure is: the masthead's caption. */
  label: string
  /** The figure with the word it needs to stand on its own, for a list row
   *  where nothing captions it — "12% equity" says what a bare "12%" can't. */
  standalone: string
}

/**
 * What a lead is worth, rendered so a retainer never reads as a one-off — and
 * so a deal with no euros in it still has a headline.
 *
 * Which component gets to be the figure is the model's call (`dealHeadline`);
 * this is only where it becomes text. Cash reads as money as it always has;
 * a deal settled in kind shows what the swap is worth, qualified by its badge;
 * an equity- or commission-only deal shows its percentage rather than the
 * nothing a euro-shaped model used to leave there.
 */
export function dealFigure(client: DealTerms): DealFigure | null {
  const headline = dealHeadline(client)
  if (!headline) return null

  switch (headline.kind) {
    case "cash": {
      const amount = formatMoney(headline.valueMinor, "eur")
      const monthly = headline.billingType === "monthly"
      const value = monthly ? `${amount}/mo` : amount
      return {
        kind: "cash",
        value,
        label: monthly ? "Per month" : "Value",
        standalone: value,
      }
    }
    case "barter": {
      const amount = formatMoney(headline.valueMinor, "eur")
      // No word appended: the Barter badge rides the same row and is the
      // qualifier, so spelling it out here would be the second time.
      return { kind: "barter", value: amount, label: "In kind", standalone: amount }
    }
    case "equity": {
      const percent = formatBps(headline.bps)
      return {
        kind: "equity",
        value: percent,
        label: "Equity",
        standalone: `${percent} equity`,
      }
    }
    case "commission": {
      const percent = formatBps(headline.bps)
      return {
        kind: "commission",
        value: percent,
        label: "Commission",
        standalone: `${percent} comm`,
      }
    }
  }
}

/** The leading line of a row — what the Leads list is sorted on. A client, a
 *  past client or a lost lead isn't waiting on anything, so it just reports
 *  when it last moved. */
export function waitedLabel(days: number, open: boolean): string {
  if (days <= 0) return "Worked today"
  const elapsed = waitingLabel(days)
  return open ? `Waiting ${elapsed}` : `Last worked ${elapsed} ago`
}
