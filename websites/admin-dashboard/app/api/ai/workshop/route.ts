import "server-only"
import { streamText, type ModelMessage } from "ai"

import {
  addWorkshopMessage,
  listWorkshopMessages,
} from "@jamie-nisbet/services"
import { modelForTier } from "@jamie-nisbet/icm"

import { requireSession } from "@/lib/api-auth"
import { buildWorkshopContext } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// The technical-workshop chat. History is server-owned: the client sends only
// the new message, the transcript is loaded from (and persisted to) the
// workshop_messages table — the brainstorm is part of the deal's record and is
// what "Crystallise" turns into a project outline.
export async function POST(request: Request) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const body = await request.json()
  const dealId = typeof body.dealId === "string" ? body.dealId : ""
  const message = typeof body.message === "string" ? body.message.trim() : ""
  if (!dealId || !message) {
    return Response.json({ error: "dealId and message are required" }, { status: 400 })
  }

  const { system } = await buildWorkshopContext(dealId)
  const history = await listWorkshopMessages(dealId)

  // Persist the user turn before generating, so the transcript survives even
  // if the stream is interrupted mid-answer.
  await addWorkshopMessage(dealId, "user", message)

  const messages: ModelMessage[] = [
    ...history.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ]

  const result = streamText({
    // Standard tier: the workshop is interactive back-and-forth, not the
    // judgment-dense single shot the heavy tier is reserved for.
    model: modelForTier("standard"),
    system,
    messages,
    async onFinish({ text }) {
      await addWorkshopMessage(dealId, "assistant", text)
    },
  })

  return result.toTextStreamResponse()
}
