import "server-only"
import {
  generateText,
  stepCountIs,
  streamText,
  tool,
  type ModelMessage,
} from "ai"
import { z } from "zod"

import {
  addWorkshopMessage,
  listWorkshopMessages,
} from "@jamie-nisbet/services"
import { modelForTier, researchModel } from "@jamie-nisbet/icm"

import { requireSession } from "@/lib/api-auth"
import { buildBrainstormContext } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// Process 1 of 3: the brainstorm — a web-connected sparring partner that
// preps the pitch. History is server-owned: the client sends only the new
// message, the transcript is loaded from (and persisted to) the
// workshop_messages table — the brainstorm is part of the deal's record and
// is what "Draft pitch" turns into the meeting-prep document.
//
// The chat model carries the conversation; when it needs the live web it
// calls the webResearch tool, which runs the query on a natively
// search-connected model (Perplexity Sonar via the same AI Gateway) and
// returns findings with sources.
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

  const { system } = await buildBrainstormContext(dealId)
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

  const webResearch = tool({
    description:
      "Deep research on the live web: markets, competitors, existing solutions, tools, pricing, technical approaches. Ask a full research question, not just keywords.",
    inputSchema: z.object({
      query: z.string().describe("The research question to investigate"),
    }),
    execute: async ({ query }) => {
      const result = await generateText({
        model: researchModel(),
        prompt: `Research this thoroughly and answer with concrete, current facts (name products, companies, prices, dates where relevant): ${query}`,
      })
      const sources = result.sources
        ?.filter((s) => s.sourceType === "url")
        .map((s) => ({ title: s.title ?? s.url, url: s.url }))
      return { findings: result.text, sources: sources ?? [] }
    },
  })

  const result = streamText({
    // Standard tier: the brainstorm is interactive back-and-forth, not the
    // judgment-dense single shot the heavy tier is reserved for.
    model: modelForTier("standard"),
    system,
    messages,
    tools: { webResearch },
    // Enough steps for a few research calls plus the final answer.
    stopWhen: stepCountIs(6),
    async onFinish({ text }) {
      if (text.trim()) await addWorkshopMessage(dealId, "assistant", text)
    },
  })

  return result.toTextStreamResponse()
}
