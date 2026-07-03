import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { Badge } from "@jamie-nisbet/ui"
import { getDeal, listDocumentsForDeal } from "@jamie-nisbet/services"

import { DealPageHeader } from "@/components/deal-page-header"
import { formatDateTime } from "@/lib/format"
import { documentStatusVariant, kindLabel } from "@/lib/kinds"

export const metadata: Metadata = { title: "Documents" }
export const dynamic = "force-dynamic"

export default async function DealDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getDeal(id)
  if (!deal) notFound()

  const documents = await listDocumentsForDeal(deal.id)

  return (
    <div className="flex flex-col gap-6">
      <DealPageHeader
        dealId={deal.id}
        dealTitle={deal.title}
        title="Documents"
        description="Every draft starts here. Open one to review, edit, and approve it — nothing is sent or invoiced until you approve."
      />

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing drafted yet — the brainstorm stage produces the first
          document.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/deals/${deal.id}/documents/${doc.id}`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {kindLabel(doc.kind)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      v{doc.version}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(doc.updatedAt)}
                  </span>
                </span>
                <Badge variant={documentStatusVariant(doc.status)}>
                  {doc.status.replace("_", " ")}
                </Badge>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
