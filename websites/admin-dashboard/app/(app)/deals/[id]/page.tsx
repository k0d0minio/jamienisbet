import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, FileText, Settings } from "lucide-react"

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@jamie-nisbet/ui"
import {
  getClient,
  getDeal,
  listDocumentsForDeal,
  parsePaymentSchedule,
} from "@jamie-nisbet/services"

import { DealStatusSelect } from "@/components/deal-status-select"
import { formatMoney } from "@/lib/money"
import { nextActionFor } from "@/lib/next-action"
import {
  DEAL_STAGES,
  dealStageStatuses,
  type DealStageStatus,
} from "@/lib/deal-stages"

export const metadata: Metadata = { title: "Deal" }
export const dynamic = "force-dynamic"

const STATUS_BADGE: Record<
  DealStageStatus,
  { label: string; variant: "success" | "default" | "outline" }
> = {
  done: { label: "Done", variant: "success" },
  current: { label: "Now", variant: "default" },
  todo: { label: "To do", variant: "outline" },
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getDeal(id)
  if (!deal) notFound()

  const [client, documents] = await Promise.all([
    getClient(deal.clientId),
    listDocumentsForDeal(deal.id),
  ])

  const milestones = parsePaymentSchedule(deal)
  const approvedKinds = new Set(
    documents.filter((d) => d.status === "approved").map((d) => d.kind)
  )

  const statuses = dealStageStatuses({
    pitchApproved: approvedKinds.has("pitch"),
    proposalApproved: approvedKinds.has("proposal"),
    hasMilestones: milestones.length > 0,
    allMilestonesInvoiced:
      milestones.length > 0 && milestones.every((m) => m.stripeInvoiceId),
  })

  const nextAction = nextActionFor(
    documents.map((d) => ({ id: d.id, kind: d.kind, status: d.status })),
    milestones
  )

  // The stage the "next action" points at — so the big card deep-links straight
  // into the page where the work happens.
  const nextHref =
    nextAction.kind === "review" && nextAction.documentId
      ? `/deals/${deal.id}/documents/${nextAction.documentId}`
      : nextAction.kind === "brainstorm"
        ? `/deals/${deal.id}/brainstorm`
        : nextAction.kind === "proposal"
          ? `/deals/${deal.id}/proposal`
          : nextAction.kind === "invoice"
            ? `/deals/${deal.id}/get-paid`
            : null

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/clients/${deal.clientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {client?.name ?? "Client"}
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{deal.title}</h1>
          {deal.billingType === "retainer" ? (
            <>
              <Badge variant="outline">Retainer</Badge>
              <Badge variant="secondary">
                {deal.recurringAmountMinor > 0
                  ? `${formatMoney(deal.recurringAmountMinor, "eur")}/mo`
                  : "—"}
              </Badge>
            </>
          ) : (
            <Badge variant="secondary">
              {deal.valueMinor > 0 ? formatMoney(deal.valueMinor, "eur") : "—"}
            </Badge>
          )}
        </div>
        <DealStatusSelect id={deal.id} value={deal.status} />
      </div>

      {/* The one thing to do next — a full-width tap target that jumps straight
          to the page where that work happens. */}
      {nextHref ? (
        <Link href={nextHref} className="block">
          <Card className="border-primary/40 transition-colors hover:border-primary">
            <CardHeader>
              <CardDescription>Next action</CardDescription>
              <CardTitle className="flex items-center justify-between gap-3 text-lg">
                <span>{nextAction.title}</span>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </CardTitle>
              <CardDescription>{nextAction.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ) : (
        <Card className="border-primary/40">
          <CardHeader>
            <CardDescription>Next action</CardDescription>
            <CardTitle className="text-lg">{nextAction.title}</CardTitle>
            <CardDescription>{nextAction.description}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* The three stages — each a large tappable row that opens its own page.
          Status pills say where the deal stands at a glance. */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Stages</h2>
        <div className="flex flex-col gap-3">
          {DEAL_STAGES.map((stage) => {
            const status = statuses[stage.slug]
            const badge = STATUS_BADGE[status]
            return (
              <Link
                key={stage.slug}
                href={`/deals/${deal.id}/${stage.slug}`}
                className="block"
              >
                <Card
                  className={cn(
                    "py-0 transition-colors hover:border-primary/60",
                    status === "current" && "border-primary/40"
                  )}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        status === "done"
                          ? "bg-success-soft text-success"
                          : status === "current"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      )}
                      aria-hidden
                    >
                      {status === "done" ? (
                        <Check className="size-4" />
                      ) : (
                        stage.step
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{stage.title}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </span>
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {stage.blurb}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Supporting pages — the drafts and the editable deal facts. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/deals/${deal.id}/documents`} className="block">
          <Card className="py-0 transition-colors hover:border-primary/60">
            <CardContent className="flex items-center gap-3 p-4">
              <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex flex-1 flex-col">
                <span className="font-medium">Documents</span>
                <span className="text-sm text-muted-foreground">
                  {documents.length === 0
                    ? "Nothing drafted yet"
                    : `${documents.length} draft${documents.length === 1 ? "" : "s"}`}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </CardContent>
          </Card>
        </Link>

        <Link href={`/deals/${deal.id}/details`} className="block">
          <Card className="py-0 transition-colors hover:border-primary/60">
            <CardContent className="flex items-center gap-3 p-4">
              <Settings className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex flex-1 flex-col">
                <span className="font-medium">Details</span>
                <span className="text-sm text-muted-foreground">
                  Title &amp; deal value
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
