import "server-only"
import { streamText } from "ai"

export const runtime = "nodejs"

// AI Gateway text generation, owner-only surface. AI_GATEWAY_API_KEY authenticates
// with Vercel's AI Gateway; the "provider/model" string ('openai/gpt-5.4') routes
// through the gateway without a separate OpenAI key.
export async function POST(request: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const { prompt } = await request.json()
  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 })
  }

  const result = streamText({
    model: "openai/gpt-5.4",
    prompt,
    onFinish({ usage }) {
      console.log("ai-gateway usage", usage)
    },
  })

  return result.toTextStreamResponse()
}
