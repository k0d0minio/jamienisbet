import "server-only"
import { streamText } from "ai"

import { createDocument, recordGeneration } from "@jamie-nisbet/services"
import { isDocumentKind } from "@jamie-nisbet/icm"

import { requireSession } from "@/lib/api-auth"
import { buildGenerationRequest, GateError } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// The ICM document engine. POST { dealId, kind, instructions? } streams the
// draft as it is written (the caller shows it live), and on finish persists it
// as the next VERSION of that (deal, kind) document — always status "draft":
// generation never bypasses the review gate. A provenance row records the
// model, stage contract, context files, and usage for the run.
//
// Structured/dual-output kinds have their own routes: triage (assessment +
// customer feedback in one run) and mockup (HTML, non-streaming).
export async function POST(request: Request) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const body = await request.json()
  const dealId = typeof body.dealId === "string" ? body.dealId : ""
  const kind = typeof body.kind === "string" ? body.kind : ""
  const instructions =
    typeof body.instructions === "string" ? body.instructions : undefined

  if (!dealId || !isDocumentKind(kind)) {
    return Response.json({ error: "dealId and a valid kind are required" }, { status: 400 })
  }
  if (kind === "triage_assessment" || kind === "mockup") {
    return Response.json(
      { error: `Use the dedicated /api/ai/${kind === "mockup" ? "mockup" : "triage"} route for this kind` },
      { status: 400 }
    )
  }

  let req
  try {
    req = await buildGenerationRequest(kind, dealId, instructions)
  } catch (err) {
    if (err instanceof GateError) {
      return Response.json({ error: err.message }, { status: 409 })
    }
    throw err
  }

  const startedAt = Date.now()
  const result = streamText({
    model: req.model,
    system: req.system,
    prompt: req.prompt,
    async onFinish({ text, usage }) {
      const doc = await createDocument({
        dealId,
        kind,
        title: req.title,
        contentMd: text,
        isPrivate: req.isPrivate,
      })
      await recordGeneration({
        dealId,
        documentId: doc.id,
        kind,
        model: req.model,
        stageContractPath: req.contractPath,
        contextFiles: req.contextFiles,
        inputTokens: usage.inputTokens ?? null,
        outputTokens: usage.outputTokens ?? null,
        latencyMs: Date.now() - startedAt,
      })
    },
  })

  return result.toTextStreamResponse()
}
