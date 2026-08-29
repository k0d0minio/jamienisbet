import { ArrowLeftRight, Hammer, PieChart, Percent } from "lucide-react"

import { Badge, cn } from "@jamie-nisbet/ui"
import type { Client } from "@jamie-nisbet/services"

import { formatBps } from "@/lib/percent"

// Not every engagement is a euro figure invoiced monthly. Some are work traded
// for work, some pay a cut of the client's own revenue through Stripe, some pay
// in a slice of the company. None of that is legible from a number in a Value
// column, and all of it changes how you treat the relationship — so it rides
// along the row as badges rather than living in a note you'd have to open the
// lead to read.
//
// One component for both the phone card and the desktop table, so the same four
// facts read identically wherever you meet them.

export type DealTerms = Pick<
  Client,
  "dealType" | "commissionBps" | "equityBps" | "workStartedAt"
>

/** Whether there is anything to show at all — a plain cash deal that hasn't
 * started yet renders nothing, which is most rows most of the time. Exported
 * because a caller laying out around the badges has to know whether there
 * will be any. */
export function hasDealTerms(client: DealTerms): boolean {
  return (
    client.dealType !== "cash" ||
    (client.commissionBps ?? 0) > 0 ||
    (client.equityBps ?? 0) > 0 ||
    client.workStartedAt !== null
  )
}

export function DealBadges({
  client,
  className,
}: {
  client: DealTerms
  className?: string
}) {
  if (!hasDealTerms(client)) return null

  const commission = client.commissionBps ?? 0
  const equity = client.equityBps ?? 0

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {/* Barter first: it qualifies the money beside it. Warning-tinted because
          that figure is notional — nothing is coming into the bank for it. */}
      {client.dealType === "barter" ? (
        <Badge variant="warning" title="Paid in kind — services exchanged, not invoiced">
          <ArrowLeftRight aria-hidden />
          Barter
        </Badge>
      ) : null}

      {commission > 0 ? (
        <Badge
          variant="secondary"
          title={`${formatBps(commission)} commission on their revenue, taken through Stripe`}
        >
          <Percent aria-hidden />
          {formatBps(commission)} comm
        </Badge>
      ) : null}

      {/* Ownership gets the solid brand fill — of everything on a row it is the
          one term you never want to skim past. */}
      {equity > 0 ? (
        <Badge title={`${formatBps(equity)} ownership stake negotiated in their company`}>
          <PieChart aria-hidden />
          {formatBps(equity)} equity
        </Badge>
      ) : null}

      {client.workStartedAt !== null ? (
        <Badge variant="success" title="Work has begun">
          <Hammer aria-hidden />
          Started
        </Badge>
      ) : null}
    </div>
  )
}
