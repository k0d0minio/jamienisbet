import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

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

import { DocumentEditor } from "@/components/document-editor"
import { DocumentReviewActions } from "@/components/document-review-actions"
import { MockupFrame } from "@/components/mockup-frame"
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
  const isHtml = doc.contentHtml !== null
  const content = (isHtml ? doc.contentHtml : doc.contentMd) ?? ""
  const editable = doc.status === "draft" || doc.status === "in_review"
  const contextFiles: string[] = generation?.contextFiles
    ? JSON.parse(generation.contextFiles)
    : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/deals/${deal.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {deal.title}
        </Link>
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

      {doc.isPrivate ? (
        <Alert>
          <AlertTitle>Private — internal only</AlertTitle>
          <AlertDescription>
            Coaching material for Jamie. Never send or show this to the client;
            it is excluded from export.
          </AlertDescription>
        </Alert>
      ) : null}

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

      {isHtml ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>
              Rendered in a sandbox (no scripts, no network).
              {doc.status === "approved" && !doc.isPrivate ? (
                <>
                  {" "}
                  <a
                    className="underline hover:text-foreground"
                    href={`/api/documents/${doc.id}/export`}
                  >
                    Download HTML
                  </a>
                </>
              ) : (
                " Approve it to unlock download/share."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MockupFrame html={content} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isHtml ? "Source" : "Document"}
          </CardTitle>
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
              and locked. Reopen it or generate a new version to change it.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <DocumentEditor
            id={doc.id}
            title={doc.title}
            content={content}
            isHtml={isHtml}
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
                    Stage contract
                  </dt>
                  <dd className="font-mono text-xs">
                    {generation.stageContractPath ?? "— (dashboard-native kind)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Context files (Layer 2–3)
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
            {doc.syncedAt ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Synced to repo: <span className="font-mono">{doc.syncPath}</span>{" "}
                ({formatDateTime(doc.syncedAt)})
              </p>
            ) : null}
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
