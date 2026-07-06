import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import {
  getDeal,
  getDocument,
  getGenerationForDocument,
  listDocumentsForDeal,
} from "@jamie-nisbet/services"

import { DealStageNav } from "@/components/deal-stage-nav"
import { DocumentEditor } from "@/components/document-editor"
import { DocumentReviewActions } from "@/components/document-review-actions"
import { formatDateTime } from "@/lib/format"
import {
  DISCLAIMER_KINDS,
  documentStatusVariant,
  kindLabel,
} from "@/lib/kinds"

export const metadata: Metadata = { title: "Document" }
export const dynamic = "force-dynamic"

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id, docId } = await params
  const [deal, doc] = await Promise.all([getDeal(id), getDocument(docId)])
  if (!deal || !doc || doc.dealId !== deal.id) notFound()

  const [generation, siblings] = await Promise.all([
    getGenerationForDocument(doc.id),
    listDocumentsForDeal(deal.id),
  ])
  const versions = siblings.filter((d) => d.kind === doc.kind)
  const content = doc.contentMd ?? doc.contentHtml ?? ""
  const editable = doc.status === "draft" || doc.status === "in_review"
  const contextFiles: string[] = generation?.contextFiles
    ? JSON.parse(generation.contextFiles)
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href={`/deals/${deal.id}/documents`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span className="truncate">{deal.title}</span>
        </Link>
        <DealStageNav dealId={deal.id} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{doc.title}</h1>
          <Badge variant="secondary">{kindLabel(doc.kind)}</Badge>
          <Badge variant="outline">v{doc.version}</Badge>
          <Badge variant={documentStatusVariant(doc.status)}>
            {doc.status.replace("_", " ")}
          </Badge>
        </div>
        <DocumentReviewActions id={doc.id} status={doc.status} />
      </div>

      {DISCLAIMER_KINDS.includes(doc.kind) ? (
        <Alert>
          <AlertTitle>Decision-support only</AlertTitle>
          <AlertDescription>
            Pricing and tax/legal treatment in this document must be confirmed
            by a licensed Portuguese contabilista certificado (and a lawyer for
            contractual terms) before it is sent.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document</CardTitle>
          {editable ? (
            <CardDescription>
              Drafts are yours to edit — the saved text is exactly what approval
              locks in.
            </CardDescription>
          ) : (
            <CardDescription>
              This version is {doc.status.replace("_", " ")}
              {doc.approvedAt
                ? ` (${formatDateTime(doc.approvedAt)})`
                : ""}{" "}
              and locked.
              {doc.status === "approved" ? (
                <>
                  {" "}
                  <a
                    className="underline hover:text-foreground"
                    href={`/api/documents/${doc.id}/export`}
                  >
                    Download
                  </a>{" "}
                  it to send, or reopen / draft a new version to change it.
                </>
              ) : (
                " Reopen it or draft a new version to change it."
              )}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <DocumentEditor
            id={doc.id}
            title={doc.title}
            content={content}
            isHtml={false}
            editable={editable}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Provenance — which model and which repo files produced this draft.
            A repeatedly-wrong output points at a Layer-3 file to fix. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {generation ? (
              <dl className="grid gap-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Model</dt>
                  <dd className="font-mono text-xs">{generation.model}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Context files (Layer 3)
                  </dt>
                  <dd>
                    {contextFiles.length ? (
                      <ul className="mt-1 grid gap-1">
                        {contextFiles.map((f) => (
                          <li key={f} className="font-mono text-xs">
                            {f}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Usage</dt>
                  <dd className="text-xs">
                    {generation.inputTokens ?? "—"} in ·{" "}
                    {generation.outputTokens ?? "—"} out
                    {generation.latencyMs
                      ? ` · ${(generation.latencyMs / 1000).toFixed(1)}s`
                      : ""}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">
                No generation recorded — this document was created or edited by
                hand.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Version trail for this kind. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between">
                  {v.id === doc.id ? (
                    <span className="text-sm font-medium">
                      v{v.version} (this one)
                    </span>
                  ) : (
                    <Link
                      href={`/deals/${deal.id}/documents/${v.id}`}
                      className="text-sm underline-offset-2 hover:underline"
                    >
                      v{v.version}
                    </Link>
                  )}
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(v.updatedAt)}
                    </span>
                    <Badge variant={documentStatusVariant(v.status)}>
                      {v.status.replace("_", " ")}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
