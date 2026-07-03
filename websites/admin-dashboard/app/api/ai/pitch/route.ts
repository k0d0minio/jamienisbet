import "server-only"
import { streamText } from "ai"

import { createDocument, recordGeneration } from "@jamie-nisbet/services"

import { requireSession } from "@/lib/api-auth"
import { buildGenerationRequest } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// Process 1 of 3, second half: "Draft pitch" — turn the brainstorm (plus the
// intake) into Jamie's meeting-prep pitch. POST { dealId, instructions? }
// streams the draft as it is written and on finish persists it as the next
// version of the deal's pitch — always status "draft": generation never
// bypasses the review gate.
export async function POST(request: Request) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const body = await request.json()
  const dealId = typeof body.dealId === "string" ? body.dealId : ""
  const instructions =
    typeof body.instructions === "string" ? body.instructions : undefined
  if (!dealId) {
    return Response.json({ error: "dealId is required" }, { status: 400 })
  }

  const req = await buildGenerationRequest("pitch", dealId, { instructions })

  const startedAt = Date.now()
  const result = streamText({
    model: req.model,
    system: req.system,
    prompt: req.prompt,
    async onFinish({ text, usage }) {
      const doc = await createDocument({
        dealId,
        kind: "pitch",
        title: req.title,
        contentMd: text,
      })
      await recordGeneration({
        dealId,
        documentId: doc.id,
        kind: "pitch",
        model: req.model,
        contextFiles: req.contextFiles,
        inputTokens: usage.inputTokens ?? null,
        outputTokens: usage.outputTokens ?? null,
        latencyMs: Date.now() - startedAt,
      })
    },
  })

  return result.toTextStreamResponse()
}
