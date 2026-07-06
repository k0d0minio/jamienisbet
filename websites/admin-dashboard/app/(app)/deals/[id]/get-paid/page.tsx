import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getDeal,
  listDocumentsForDeal,
  parsePaymentSchedule,
} from "@jamie-nisbet/services"

import { DealPageHeader } from "@/components/deal-page-header"
import { DocumentGenerator } from "@/components/document-generator"
import { PaymentPlan, type MilestoneView } from "@/components/payment-plan"
import { getDealStage } from "@/lib/deal-stages"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = { title: "Get paid" }
export const dynamic = "force-dynamic"

const stage = getDealStage("get-paid")!

export default async function GetPaidStagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getDeal(id)
  if (!deal) notFound()

  const documents = await listDocumentsForDeal(deal.id)
  const milestones = parsePaymentSchedule(deal)
  const proposalApproved = documents.some(
    (d) => d.kind === "proposal" && d.status === "approved"
  )

  // Live invoice status per milestone, read from Stripe (the source of truth
  // for money). Best-effort: a Stripe hiccup shows the milestone without a
  // status rather than hiding the step.
  const stripe = getStripe()
  const milestoneViews: MilestoneView[] = await Promise.all(
    milestones.map(async (m) => {
      let invoiceStatus: string | null = null
      if (m.stripeInvoiceId && stripe) {
        try {
          const invoice = await stripe.invoices.retrieve(m.stripeInvoiceId)
          invoiceStatus = invoice.status ?? null
        } catch {
          invoiceStatus = null
        }
      }
      return {
        id: m.id,
        label: m.label,
        amountMinor: m.amountMinor,
        stripeInvoiceId: m.stripeInvoiceId ?? null,
        invoiceStatus,
      }
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <DealPageHeader
        dealId={deal.id}
        dealTitle={deal.title}
        title={`${stage.step} · ${stage.title}`}
        description={stage.blurb}
      />

      <PaymentPlan
        dealId={deal.id}
        milestones={milestoneViews}
        unlocked={proposalApproved}
        stripeConfigured={isStripeConfigured()}
      />

      {proposalApproved ? (
        <DocumentGenerator
          dealId={deal.id}
          kind="contract"
          title="Draft the contract"
          blurb="Turn the approved proposal into the agreement — parties, scope, price, schedule, IP and termination. A lawyer must review it before you send or sign; nothing is sent from here."
          cta="Draft the contract"
          notePlaceholder="Optional: any special terms agreed (NDA, IP assignment, jurisdiction)"
        />
      ) : null}
    </div>
  )
}
