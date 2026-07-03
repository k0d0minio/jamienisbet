import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import {
  getClient,
  getDeal,
  listDocumentsForDeal,
  listWorkshopMessages,
  parsePaymentSchedule,
} from "@jamie-nisbet/services"

import { DealStatusSelect } from "@/components/deal-status-select"
import { DealDetailsForm } from "@/components/deal-details-form"
import { BrainstormChat } from "@/components/brainstorm-chat"
import { PaymentPlan, type MilestoneView } from "@/components/payment-plan"
import { ProposalBuilder } from "@/components/proposal-builder"
import { formatDateTime } from "@/lib/format"
import { formatMoney } from "@/lib/money"
import { documentStatusVariant, kindLabel } from "@/lib/kinds"
import { nextActionFor } from "@/lib/next-action"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = { title: "Deal" }
export const dynamic = "force-dynamic"

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getDeal(id)
  if (!deal) notFound()

  const [client, documents, brainstorm] = await Promise.all([
    getClient(deal.clientId),
    listDocumentsForDeal(deal.id),
    listWorkshopMessages(deal.id),
  ])

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

  const nextAction = nextActionFor(
    documents.map((d) => ({ id: d.id, kind: d.kind, status: d.status })),
    milestones
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/clients/${deal.clientId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {client?.name ?? "Client"}
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{deal.title}</h1>
          <Badge variant="secondary">
            {deal.valueMinor > 0 ? formatMoney(deal.valueMinor, "eur") : "—"}
          </Badge>
        </div>
        <DealStatusSelect id={deal.id} value={deal.status} />
      </div>

      {/* Where the deal is in the three steps, and the one thing to do next. */}
      <Card className="border-primary/40">
        <CardHeader>
          <CardDescription>Next action</CardDescription>
          <CardTitle className="text-lg">
            {nextAction.kind === "review" && nextAction.documentId ? (
              <Link
                href={`/deals/${deal.id}/documents/${nextAction.documentId}`}
                className="underline-offset-4 hover:underline"
              >
                {nextAction.title} →
              </Link>
            ) : (
              nextAction.title
            )}
          </CardTitle>
          <CardDescription>{nextAction.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1 — brainstorm the ask, draft the pitch for the meeting. */}
      <Card>
        <CardHeader>
          <CardTitle>1 · Brainstorm &amp; pitch</CardTitle>
          <CardDescription>
            Think the lead&apos;s ask through with a web-connected research
            partner, then draft the pitch you&apos;ll present over a coffee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrainstormChat
            dealId={deal.id}
            initialMessages={brainstorm.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            }))}
          />
        </CardContent>
      </Card>

      {/* Step 2 — after the meeting: what was agreed becomes the proposal. */}
      <Card>
        <CardHeader>
          <CardTitle>2 · Proposal</CardTitle>
          <CardDescription>
            The meeting happened — write down what you agreed and the payment
            structure. The draft covers cost, business and technical
            requirements, terms, and the how-we-work-together brief.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalBuilder dealId={deal.id} />
        </CardContent>
      </Card>

      {/* Step 3 — the approved proposal's payment schedule, invoiced. */}
      <Card>
        <CardHeader>
          <CardTitle>3 · Get paid</CardTitle>
          <CardDescription>
            One Stripe draft invoice per milestone of the approved proposal —
            finalize &amp; send each from Invoices when it falls due.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentPlan
            dealId={deal.id}
            milestones={milestoneViews}
            unlocked={proposalApproved}
            stripeConfigured={isStripeConfigured()}
          />
        </CardContent>
      </Card>

      {/* Documents — the pitch and proposal drafts, newest first. Each row is
          a version; approval state is the review gate. */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Every draft starts here. Open one to review, edit, and approve it —
            nothing is sent or invoiced until you approve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing drafted yet — step 1 produces the first document.
            </p>
          ) : (
            <ul className="divide-y">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/deals/${deal.id}/documents/${doc.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {kindLabel(doc.kind)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        v{doc.version}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(doc.updatedAt)}
                      </span>
                      <Badge variant={documentStatusVariant(doc.status)}>
                        {doc.status.replace("_", " ")}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Deal facts — editable; value follows the proposal's payment total. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DealDetailsForm
            id={deal.id}
            title={deal.title}
            valueMinor={deal.valueMinor}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Created {formatDateTime(deal.createdAt)} · Brainstorm messages:{" "}
            {brainstorm.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
