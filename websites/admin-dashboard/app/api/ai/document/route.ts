import "server-only"
import { streamText } from "ai"
import { z } from "zod"

import { createDocument, recordGeneration } from "@jamie-nisbet/services"

import { requireSession } from "@/lib/api-auth"
import { buildGenerationRequest } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// The generic generator for the deal's auxiliary documents — the kinds that
// take no structured input beyond the deal itself and just stream a draft
// behind the review gate. `pitch` keeps its own route (it is driven from the
// brainstorm thread) and `proposal` keeps its own (it also stores the payment
// schedule on the deal), so this route deliberately serves only these three.
// POST { dealId, kind, instructions? }.
const AUX_KINDS = ["triage", "negotiation", "contract"] as const
type AuxKind = (typeof AUX_KINDS)[number]

const body = z.object({
  dealId: z.string().min(1),
  kind: z.enum(AUX_KINDS),
  instructions: z.string().optional(),
})

export async function POST(request: Request) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const parsed = body.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json(
      { error: "dealId and a valid document kind are required" },
      { status: 400 }
    )
  }
  const { dealId, instructions } = parsed.data
  const kind = parsed.data.kind as AuxKind

  const req = await buildGenerationRequest(kind, dealId, { instructions })

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
      })
      await recordGeneration({
        dealId,
        documentId: doc.id,
        kind,
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
