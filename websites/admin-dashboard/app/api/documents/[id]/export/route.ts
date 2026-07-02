import "server-only"

import { getDocument } from "@jamie-nisbet/services"

import { requireSession } from "@/lib/api-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Download an APPROVED document — the file Jamie hands to the customer.
// Export is a consumption of the artifact, so it sits strictly behind the
// review gate: drafts and private documents are never exportable.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  const { id } = await params
  const doc = await getDocument(id)
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 })
  if (doc.isPrivate) {
    return Response.json(
      { error: "Private documents are internal-only and cannot be exported." },
      { status: 403 }
    )
  }
  if (doc.status !== "approved") {
    return Response.json(
      { error: "Only approved documents can be exported — review it first." },
      { status: 403 }
    )
  }

  const isHtml = doc.contentHtml !== null
  const body = (isHtml ? doc.contentHtml : doc.contentMd) ?? ""
  const slug = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  const filename = `${slug || doc.kind}-v${doc.version}.${isHtml ? "html" : "md"}`

  return new Response(body, {
    headers: {
      "Content-Type": isHtml ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
