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
} from "@jamie-nisbet/services"

import { DealStatusSelect } from "@/components/deal-status-select"
import { DealDetailsForm } from "@/components/deal-details-form"
import { GeneratePanel } from "@/components/generate-panel"
import { InvoiceFromQuoteButton } from "@/components/invoice-from-quote-button"
import { MockupPanel } from "@/components/mockup-panel"
import { WorkshopChat } from "@/components/workshop-chat"
import { formatDateTime } from "@/lib/format"
import { formatMoney } from "@/lib/money"
import { documentStatusVariant, kindLabel } from "@/lib/kinds"
import { nextActionFor } from "@/lib/next-action"
import { isStripeConfigured } from "@/lib/stripe"

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

  const [client, documents, workshop] = await Promise.all([
    getClient(deal.clientId),
    listDocumentsForDeal(deal.id),
    listWorkshopMessages(deal.id),
  ])

  // The upstream approvals that unlock each generator (UX only — the API
  // re-enforces every gate).
  const hasApproved = (kind: string) =>
    documents.some((d) => d.kind === kind && d.status === "approved")
  const gates = {
    approvedTriage: hasApproved("triage_assessment"),
    approvedOutline: hasApproved("project_outline"),
    approvedStrategy: hasApproved("negotiation_strategy"),
    approvedProposal: hasApproved("proposal"),
  }

  const nextAction = nextActionFor(
    documents.map((d) => ({ id: d.id, kind: d.kind, status: d.status }))
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

      {/* Where the macro-pipeline says this deal is, and the one thing to do
          next. */}
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
        {nextAction.kind === "invoice" && isStripeConfigured() ? (
          <CardContent>
            <InvoiceFromQuoteButton dealId={deal.id} />
          </CardContent>
        ) : null}
      </Card>

      {/* The ICM engine — each button executes one stage contract against this
          deal's working material and drops a draft below. */}
      <Card>
        <CardHeader>
          <CardTitle>Generate</CardTitle>
          <CardDescription>
            Each step runs its ICM stage contract with only the context that
            stage names. Locked steps unlock when the upstream document is
            approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeneratePanel dealId={deal.id} gates={gates} />
        </CardContent>
      </Card>

      {/* The brainstorm surface — persisted per deal. */}
      <Card>
        <CardHeader>
          <CardTitle>Technical workshop</CardTitle>
          <CardDescription>
            Private sparring on how to build it. Crystallise the thread into a
            project outline when the direction is right.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkshopChat
            dealId={deal.id}
            initialMessages={workshop.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            }))}
          />
        </CardContent>
      </Card>

      {/* Mockups — branded HTML concepts the client can react to. */}
      <Card>
        <CardHeader>
          <CardTitle>Mockups</CardTitle>
          <CardDescription>
            Self-contained HTML concepts styled from the design-system tokens.
            Fan out three directions, pick one, iterate — each pass is a new
            version in Documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MockupPanel
            dealId={deal.id}
            mockups={documents
              .filter((d) => d.kind === "mockup")
              .map((d) => ({
                id: d.id,
                version: d.version,
                status: d.status,
                title: d.title,
              }))}
          />
        </CardContent>
      </Card>

      {/* Documents — every artifact the pipeline has produced for this deal,
          newest first. Each row is a version; approval state is the review
          gate. */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Every generated artifact starts as a draft. Open one to review, edit,
            and approve it — only approved versions feed the next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing generated yet — run a step above to draft the first
              document.
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
                      {doc.isPrivate ? (
                        <Badge variant="outline">Private</Badge>
                      ) : null}
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

      {/* Deal facts — editable; value is what the pipeline metrics sum. */}
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
            Created {formatDateTime(deal.createdAt)} · Workshop messages:{" "}
            {workshop.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
