import "server-only"
import { randomUUID } from "node:crypto"
import { streamText } from "ai"
import { z } from "zod"

import {
  createDocument,
  recordGeneration,
  setDealPaymentSchedule,
} from "@jamie-nisbet/services"

import { requireSession } from "@/lib/api-auth"
import { buildGenerationRequest, type ProposalInputs } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// Process 2 of 3: the proposal. POST what Jamie agreed with the client at the
// meeting — the plan, the timeline, and the payment structure — and this
// route (1) stores the payment schedule on the deal (that stored schedule is
// what the invoicing step executes later, so document and billing can never
// drift), then (2) streams the proposal draft and persists it behind the
// review gate like every other document.
const proposalBody = z.object({
  dealId: z.string().min(1),
  agreedPlan: z
    .string()
    .trim()
    .min(1, "Describe what you agreed with the client."),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  milestones: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        // EUR minor units (cents), from the form's parsed amounts.
        amountMinor: z.number().int().positive(),
      })
    )
    .min(1, "Add at least one payment milestone."),
})

export async function POST(request: Request) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const parsed = proposalBody.safeParse(await request.json())
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return Response.json(
      { error: issue ? issue.message : "Invalid proposal input" },
      { status: 400 }
    )
  }
  const { dealId, agreedPlan, timeline, notes, milestones } = parsed.data

  // The agreed payment structure becomes the deal's schedule (and its value)
  // BEFORE the document exists — the schedule is the business fact, the
  // proposal is its write-up. Re-drafting replaces the schedule; milestones
  // already invoiced keep their invoices (they are linked by Stripe id on the
  // old schedule — re-drafting after invoicing starts the plan over, which is
  // the deliberate, visible behaviour).
  const deal = await setDealPaymentSchedule(
    dealId,
    milestones.map((m) => ({ id: randomUUID(), ...m }))
  )
  if (!deal) {
    return Response.json({ error: "That deal no longer exists." }, { status: 404 })
  }

  const inputs: ProposalInputs = { agreedPlan, timeline, notes, milestones }
  const req = await buildGenerationRequest("proposal", dealId, {
    proposalInputs: inputs,
  })

  const startedAt = Date.now()
  const result = streamText({
    model: req.model,
    system: req.system,
    prompt: req.prompt,
    async onFinish({ text, usage }) {
      const doc = await createDocument({
        dealId,
        kind: "proposal",
        title: req.title,
        contentMd: text,
      })
      await recordGeneration({
        dealId,
        documentId: doc.id,
        kind: "proposal",
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
