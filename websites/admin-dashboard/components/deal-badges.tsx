import { ArrowLeftRight, Hammer, PieChart, Percent } from "lucide-react"

import { Badge, cn } from "@jamie-nisbet/ui"
import {
  dealComponents,
  type DealComponentKind,
  type DealTerms,
} from "@jamie-nisbet/services"

import { formatBps } from "@/lib/percent"

// Not every engagement is a euro figure invoiced monthly. Some are work traded
// for work, some pay a cut of the client's own revenue through Stripe, some pay
// in a slice of the company. None of that is legible from a number in a Value
// column, and all of it changes how you treat the relationship — so it rides
// along the row as badges rather than living in a note you'd have to open the
// lead to read.
//
// One component wherever they appear — the list row's third line and the lead
// profile's identity header — so the same four facts read identically. What the
// headline figure beside them already carries is passed in as `omit` and left
// out here: an equity-only deal says "12% equity" once, not twice. Both of
// those are app-tier surfaces, so the badges round fully rather than taking the
// marketing tier's 5px corners: a pill inside a 16px slab, not a small box
// inside a big one. The figures stay mono, which they were already.

/** App-tier pills: full radius, and a hair more room around the glyph than the
 *  marketing badge's 5px box wants. */
const PILL = "rounded-full px-2.5"

/** The deal itself, plus the one delivery fact that rides alongside it: whether
 *  the doing has begun. `workStartedAt` is deliberately not a deal component —
 *  it says nothing about what was agreed — but it belongs on the same line. */
export type DealBadgeTerms = DealTerms & { workStartedAt: Date | null }

/** Which badges this record would render, given what the headline figure beside
 *  them already says. */
function badgeKinds(
  client: DealBadgeTerms,
  omit?: DealComponentKind | null
): DealComponentKind[] {
  return dealComponents(client)
    .map((component) => component.kind)
    .filter((kind) => {
      // Cash is the ordinary case and never took a badge: a euro figure on the
      // row says everything a "Cash" pill would.
      if (kind === "cash") return false
      // Barter survives `omit` even when it is itself the headline. The other
      // pills repeat the figure beside them; this one qualifies it — without
      // it a swap's notional €800 reads as €800 of income.
      if (kind === "barter") return true
      return kind !== omit
    })
}

/** Whether there is anything to show at all — a plain cash deal that hasn't
 * started yet renders nothing, which is most rows most of the time. Exported
 * because a caller laying out around the badges has to know whether there
 * will be any. */
export function hasDealBadges(
  client: DealBadgeTerms,
  omit?: DealComponentKind | null
): boolean {
  return badgeKinds(client, omit).length > 0 || client.workStartedAt !== null
}

export function DealBadges({
  client,
  omit,
  className,
}: {
  client: DealBadgeTerms
  /** The component the headline figure beside these badges already carries.
   *  Passed so an equity-only deal reads "12% equity" once rather than as a
   *  figure and a pill saying the same thing. Barter is never omitted: its
   *  badge qualifies the euro figure rather than repeating it. */
  omit?: DealComponentKind | null
  className?: string
}) {
  if (!hasDealBadges(client, omit)) return null

  const kinds = new Set(badgeKinds(client, omit))
  const commission = client.commissionBps ?? 0
  const equity = client.equityBps ?? 0

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {/* Barter first: it qualifies the money beside it. Warning-tinted because
          that figure is notional — nothing is coming into the bank for it. */}
      {kinds.has("barter") ? (
        <Badge
          variant="warning"
          className={PILL}
          title="Paid in kind — services exchanged, not invoiced"
        >
          <ArrowLeftRight aria-hidden />
          Barter
        </Badge>
      ) : null}

      {/* Ownership gets the solid brand fill — of everything on a row it is the
          one term you never want to skim past. */}
      {kinds.has("equity") ? (
        <Badge
          className={PILL}
          title={`${formatBps(equity)} ownership stake negotiated in their company`}
        >
          <PieChart aria-hidden />
          {formatBps(equity)} equity
        </Badge>
      ) : null}

      {kinds.has("commission") ? (
        <Badge
          variant="secondary"
          className={PILL}
          title={`${formatBps(commission)} commission on their revenue, taken through Stripe`}
        >
          <Percent aria-hidden />
          {formatBps(commission)} comm
        </Badge>
      ) : null}

      {client.workStartedAt !== null ? (
        <Badge variant="success" className={PILL} title="Work has begun">
          <Hammer aria-hidden />
          Started
        </Badge>
      ) : null}
    </div>
  )
}
