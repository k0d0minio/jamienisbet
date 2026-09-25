import {
  IDLE_AFTER_DAYS,
  activeStatuses,
  clientStatuses,
  customerStatuses,
  dealHeadline,
  fitTiers,
  nextActionStatuses,
  nurtureStatuses,
  openStatuses,
  pastStatuses,
  prospectStatuses,
  type Client,
  type DealComponentKind,
  type DealTerms,
} from "@jamie-nisbet/services"

import { daysSince, formatShortDay, waitingLabel } from "@/lib/format"
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

/** Imported and not yet engaged — the cold pool. Never open, never a customer,
 *  never stale, and never in a money figure: it is a different population from
 *  the roster, which is why the leads list gives it a view of its own rather
 *  than a fifth filter. */
export function isProspect(client: Client): boolean {
  return (prospectStatuses as readonly string[]).includes(client.status)
}

/** Parked inside that pool — the cadence is spent, or they said "not now".
 *  Muted and last among the prospects, the way a past client is muted among
 *  the clients. */
export function isNurtured(client: Client): boolean {
  return (nurtureStatuses as readonly string[]).includes(client.status)
}

/** Only an open lead can be "waiting" — a client, a past client, a lost one or
 *  a prospect isn't owed a reply. A prospect in particular owes nothing yet:
 *  what drives it is its own next action, not how long it has sat, so it can
 *  never reach the staleness threshold. */
export function isStale(client: Client, now: number): boolean {
  return isOpenLead(client) && daysWaiting(client, now) >= STALE_AFTER_DAYS
}

// The two cracks the Needs you feed counts, as predicates over a row already
// in memory.
//
// They are the SQL in `packages/services/queries/crack-finder.ts` said again in
// TypeScript, which is a duplication worth being uncomfortable about — so it
// earns its place narrowly: the feed asks the database for the *counts*, and
// the leads list, which has already read every row to render itself, filters
// them here rather than paying for a seventh query to show the same rows. The
// contract is that a count and the screen it links to agree, so if one of these
// two definitions moves, both move.

/** Being worked, with no next step — or one nobody dated, which never reaches
 *  the due queue and so is the same crack. Mirrors `unplannedWhere`. */
export function hasNoPlan(client: Client): boolean {
  return (
    (nextActionStatuses as readonly string[]).includes(client.status) &&
    (client.nextAction === null || client.nextActionDue === null)
  )
}

/** Mid-conversation and nothing has happened in a fortnight. Mirrors
 *  `idleWhere` — including its clock, `last_touched_at` falling back to when
 *  the row arrived. */
export function isIdleDiscussion(client: Client, now: number): boolean {
  return (
    client.status === "discussing" && daysWaiting(client, now) >= IDLE_AFTER_DAYS
  )
}

/** Where a prospect sits in the queue: tier first (A before B before C, and an
 *  untiered row after all three — it hasn't been graded, not graded badly),
 *  parked rows after every working one. Ties fall back to the order the query
 *  handed over, which is longest-waiting first. */
export function compareProspects(a: Client, b: Client): number {
  const parked = Number(isNurtured(a)) - Number(isNurtured(b))
  if (parked !== 0) return parked
  return tierRank(a.fitTier) - tierRank(b.fitTier)
}

function tierRank(tier: string | null): number {
  const index = (fitTiers as readonly string[]).indexOf(tier ?? "")
  return index === -1 ? fitTiers.length : index
}

/** What a prospect *is*, in the line a row has for it: what they do and where
 *  they are. It replaces the waiting line, which says nothing true about a row
 *  nobody is waiting on. Falls back to `whoLabel` for a prospect the import
 *  couldn't profile. */
export function prospectLabel(client: Client): string | null {
  const facts = [client.sector, client.town].filter(Boolean).join(" · ")
  return facts || whoLabel(client)
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
      // "One-off + support": the monthly support line rides in the figure
      // itself — "€2,400 + €60/mo" — so a build with a support line never
      // reads as a bare one-off on a row (icm-board pricing.md § Support).
      const support =
        !monthly && client.supportMinor > 0
          ? ` + ${formatMoney(client.supportMinor, "eur")}/mo`
          : ""
      const value = monthly ? `${amount}/mo` : `${amount}${support}`
      return {
        kind: "cash",
        value,
        label: monthly ? "Per month" : support ? "Value + support" : "Value",
        standalone: value,
      }
    }
    case "support": {
      // A support line with no fee beside it — a build handed over before the
      // dashboard existed, say. The figure is the monthly line itself.
      const amount = formatMoney(headline.valueMinor, "eur")
      return {
        kind: "support",
        value: `${amount}/mo`,
        label: "Support",
        standalone: `${amount}/mo support`,
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

/** What a row's leading line says when there *is* a plan, and whether it has
 *  already slipped. */
export type NextActionLine = { text: string; overdue: boolean }

/**
 * What happens next with this lead, as one line.
 *
 * It takes over the row's leading line wherever a lead has one, and it earns
 * that place: "Waiting 12 days" describes a state, "Call back after the lunch
 * service · 2 Sep" is the work. For a prospect it is the whole point — nobody
 * is waiting on an imported business, so the line that says how long they have
 * waited was never true about them.
 *
 * Null when nothing is planned, which is allowed: the row then falls back to
 * what it always said, and the Needs you feed is where a missing plan gets
 * mentioned.
 */
export function nextActionLine(
  client: Client,
  now: number
): NextActionLine | null {
  if (!client.nextAction) return null
  const due = client.nextActionDue
  return {
    text: due
      ? `${client.nextAction} · ${formatShortDay(due)}`
      : client.nextAction,
    overdue: due !== null && due.getTime() < now,
  }
}

/** A parked lead's line: when it comes back. Null for anyone who isn't
 *  parked, and for a parked row with no date on it — which is its own kind of
 *  crack, and one the feed reports rather than the row. */
export function wakeLine(client: Client): string | null {
  if (!isNurtured(client) || !client.wakeAt) return null
  return `Wakes ${formatShortDay(client.wakeAt)}`
}

/** The leading line of a row — what the Leads list is sorted on. A client, a
 *  past client or a lost lead isn't waiting on anything, so it just reports
 *  when it last moved. */
export function waitedLabel(days: number, open: boolean): string {
  if (days <= 0) return "Worked today"
  const elapsed = waitingLabel(days)
  return open ? `Waiting ${elapsed}` : `Last worked ${elapsed} ago`
}

// The Leads table's sort (leads-table-board, D-33). Every column but the row
// actions sorts; the choice rides the URL as `?sort=<key>&dir=asc|desc` and is
// applied here, on the server, so a reload or a shared link keeps the order.
//
// Two rules hold for every column. Empty values — no stage, no deal, no next
// step, no date, no tier — sort last in *both* directions: flipping a column
// is for reading the other end of what is there, never for surfacing the
// blanks. And the sort is stable, so ties keep whatever order the rows came
// in: the view's own default (longest-waiting first, or the pool's tier order).

export const leadSortKeys = [
  "name",
  "status",
  "stage",
  "value",
  "next",
  "due",
  "last",
  "tier",
] as const
export type LeadSortKey = (typeof leadSortKeys)[number]
export type SortDir = "asc" | "desc"
export type LeadSort = { key: LeadSortKey; dir: SortDir }

/** What the first click on a header does. The columns read as a question
 *  asked of the list — who is worth most, who has waited longest — start at
 *  the answer; the rest start at the top of the alphabet or the calendar. */
export function firstDirection(key: LeadSortKey): SortDir {
  return key === "value" || key === "last" ? "desc" : "asc"
}

/** The URL's sort, or null for the view's default order. An unknown key or
 *  direction is ignored rather than guessed at. */
export function parseLeadSort(
  sort: string | undefined,
  dir: string | undefined
): LeadSort | null {
  if (!sort || !(leadSortKeys as readonly string[]).includes(sort)) return null
  const key = sort as LeadSortKey
  if (dir === undefined) return { key, dir: firstDirection(key) }
  if (dir !== "asc" && dir !== "desc") return null
  return { key, dir }
}

/** When the next step is due — or, for a parked prospect with no next step,
 *  when it wakes. The table's Due column and the board's card foot both read
 *  this, so the two never disagree about a date. */
export function dueOf(client: Client): Date | null {
  if (client.nextActionDue) return client.nextActionDue
  if (!client.nextAction && isNurtured(client)) return client.wakeAt
  return null
}

/** The headline figure's euro amount, for sorting on Value: cash, support or
 *  barter. A deal whose headline is a percentage has no euros to compare. */
function valueMinorOf(client: Client): number | null {
  const headline = dealHeadline(client)
  if (!headline) return null
  switch (headline.kind) {
    case "cash":
    case "support":
    case "barter":
      return headline.valueMinor
    default:
      return null
  }
}

type SortValue = number | string | null

/**
 * The rows in the order a column asks for, as a new array. `stageOf` answers
 * which deal stage a row's folder is at ("03"), null when there is none.
 */
export function sortLeads(
  rows: Client[],
  sort: LeadSort,
  { now, stageOf }: { now: number; stageOf: (client: Client) => string | null }
): Client[] {
  const valueOf = (client: Client): SortValue => {
    switch (sort.key) {
      case "name":
        return client.name.toLocaleLowerCase()
      case "status":
        return (clientStatuses as readonly string[]).indexOf(client.status)
      case "stage": {
        const code = stageOf(client)
        return code === null ? null : Number(code)
      }
      case "value":
        return valueMinorOf(client)
      case "next":
        return client.nextAction ? client.nextAction.toLocaleLowerCase() : null
      case "due":
        return dueOf(client)?.getTime() ?? null
      case "last":
        return daysWaiting(client, now)
      case "tier": {
        const index = (fitTiers as readonly string[]).indexOf(client.fitTier ?? "")
        return index === -1 ? null : index
      }
    }
  }
  const sign = sort.dir === "asc" ? 1 : -1
  const keyed = rows.map((client) => ({ client, value: valueOf(client) }))
  keyed.sort((a, b) => {
    if (a.value === null || b.value === null) {
      // Blanks last, whichever way the column runs.
      return a.value === b.value ? 0 : a.value === null ? 1 : -1
    }
    if (typeof a.value === "string" && typeof b.value === "string") {
      return sign * a.value.localeCompare(b.value)
    }
    return sign * ((a.value as number) - (b.value as number))
  })
  return keyed.map((entry) => entry.client)
}
