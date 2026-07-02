import "server-only"
import { generateText } from "ai"

import {
  createDocument,
  getDocument,
  recordGeneration,
} from "@jamie-nisbet/services"

import { requireSession } from "@/lib/api-auth"
import { buildGenerationRequest, GateError } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// Mockup generation — one self-contained, inert HTML page per run, styled
// from the design-system token files (the brand is never forked per surface).
// Non-streaming: watching raw HTML arrive isn't useful; the caller shows a
// spinner and the finished draft renders sandboxed. "3 directions" is the
// client firing this route once per direction hint; iteration passes the
// version being refined as baseDocumentId and lands as the next version.
export async function POST(request: Request) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const body = await request.json()
  const dealId = typeof body.dealId === "string" ? body.dealId : ""
  const direction = typeof body.direction === "string" ? body.direction : ""
  const instructions =
    typeof body.instructions === "string" ? body.instructions : undefined
  const baseDocumentId =
    typeof body.baseDocumentId === "string" ? body.baseDocumentId : ""

  if (!dealId) {
    return Response.json({ error: "dealId is required" }, { status: 400 })
  }

  let req
  try {
    req = await buildGenerationRequest("mockup", dealId, instructions)
  } catch (err) {
    if (err instanceof GateError) {
      return Response.json({ error: err.message }, { status: 409 })
    }
    throw err
  }

  let prompt = req.prompt
  if (direction) {
    prompt += `\n\n## Art direction for this variant\n\n${direction}`
  }
  if (baseDocumentId) {
    const base = await getDocument(baseDocumentId)
    if (!base || base.dealId !== dealId || base.contentHtml === null) {
      return Response.json(
        { error: "baseDocumentId must be a mockup on this deal" },
        { status: 400 }
      )
    }
    prompt += `\n\n## Iterate on this existing mockup (v${base.version})\n\nRework the HTML below according to Jamie's instructions, keeping what already works:\n\n${base.contentHtml}`
  }

  const startedAt = Date.now()
  const { text, usage } = await generateText({
    model: req.model,
    system: req.system,
    prompt,
  })
  const latencyMs = Date.now() - startedAt

  // Models occasionally wrap the page in a markdown fence despite the rules —
  // strip it so contentHtml is always a bare document.
  const html = text
    .trim()
    .replace(/^```(?:html)?\s*\n/, "")
    .replace(/\n```\s*$/, "")

  const doc = await createDocument({
    dealId,
    kind: "mockup",
    title: direction ? `Mockup — ${direction.slice(0, 60)}` : "Mockup",
    contentHtml: html,
  })
  await recordGeneration({
    dealId,
    documentId: doc.id,
    kind: "mockup",
    model: req.model,
    stageContractPath: req.contractPath,
    contextFiles: req.contextFiles,
    inputTokens: usage.inputTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    latencyMs,
  })

  return Response.json({ documentId: doc.id, version: doc.version })
}
