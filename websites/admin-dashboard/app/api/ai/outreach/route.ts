import "server-only"
import { streamText } from "ai"
import { z } from "zod"

import { createTouchDraft, recordGeneration } from "@jamie-nisbet/services"
import { isTouchKind, type TouchKind } from "@jamie-nisbet/icm"

import { requireSession } from "@/lib/api-auth"
import { buildOutreachRequest } from "@/lib/outreach-context"

export const runtime = "nodejs"
export const maxDuration = 300

// Stream one outreach/follow-up/chase draft for a client. Draft-only by
// design: the result lands as a biz.touches row behind the review gate, and
// sending stays manual and off-platform. Lives under /api/ai/ so the Layer-3
// files it reads are covered by the existing outputFileTracingIncludes globs.
// POST { clientId, kind, guidance? }.
const body = z.object({
  clientId: z.string().min(1),
  kind: z.string().refine(isTouchKind, "unknown outreach kind"),
  guidance: z.string().optional(),
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
      { error: "clientId and a valid outreach kind are required" },
      { status: 400 }
    )
  }
  const { clientId, guidance } = parsed.data
  const kind = parsed.data.kind as TouchKind

  const req = await buildOutreachRequest(kind, clientId, { guidance })

  const startedAt = Date.now()
  const result = streamText({
    model: req.model,
    system: req.system,
    prompt: req.prompt,
    async onFinish({ text, usage }) {
      await createTouchDraft({ clientId, kind, contentMd: text })
      await recordGeneration({
        clientId,
        kind: `touch:${kind}`,
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
