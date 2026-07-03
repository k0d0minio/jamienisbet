"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@jamie-nisbet/ui"

import { createMilestoneInvoiceAction } from "@/app/(app)/deals/actions"
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"
import { formatMoney } from "@/lib/money"

export type MilestoneView = {
  id: string
  label: string
  amountMinor: number
  stripeInvoiceId: string | null
  /** Live Stripe status when an invoice is linked (draft/open/paid/void). */
  invoiceStatus: string | null
}

/**
 * Step 3 — get paid. The approved proposal's payment structure, milestone by
 * milestone: raise the Stripe draft invoice for each when it falls due.
 * Drafts are never emailed from here — finalize & send stays a deliberate
 * second step on the Invoices page, same as every other invoice.
 */
export function PaymentPlan({
  dealId,
  milestones,
  unlocked,
  stripeConfigured,
}: {
  dealId: string
  milestones: MilestoneView[]
  unlocked: boolean
  stripeConfigured: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (milestones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payment structure yet — it is set when you draft the proposal in
        step 2.
      </p>
    )
  }

  function raise(milestoneId: string) {
    setError(null)
    setBusyId(milestoneId)
    startTransition(async () => {
      try {
        await createMilestoneInvoiceAction(dealId, milestoneId)
        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not create the invoice."
        )
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y">
        {milestones.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 py-3"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground">
                {formatMoney(m.amountMinor, "eur")}
              </span>
            </span>
            {m.stripeInvoiceId ? (
              <span className="flex items-center gap-2">
                <InvoiceStatusBadge status={m.invoiceStatus ?? "draft"} />
                {m.invoiceStatus === "draft" ? (
                  <span className="text-xs text-muted-foreground">
                    send it from Invoices
                  </span>
                ) : null}
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={!unlocked || !stripeConfigured || pending}
                title={
                  !stripeConfigured
                    ? "Stripe is not configured in this environment."
                    : !unlocked
                      ? "Approve the proposal first — it authorises these figures."
                      : undefined
                }
                onClick={() => raise(m.id)}
              >
                {busyId === m.id ? "Creating…" : "Create draft invoice"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!unlocked ? (
        <p className="text-xs text-muted-foreground">
          Invoicing unlocks when the proposal is approved — your sign-off on
          the figures is the gate.
        </p>
      ) : null}
    </div>
  )
}
