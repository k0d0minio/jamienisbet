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
import { formatDateTime } from "@/lib/format"
import { formatMoney } from "@/lib/money"
import { documentStatusVariant, kindLabel } from "@/lib/kinds"

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
