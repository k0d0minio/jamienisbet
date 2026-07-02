import "server-only"
import { generateObject } from "ai"
import { z } from "zod"

import { createDocument, recordGeneration } from "@jamie-nisbet/services"

import { requireSession } from "@/lib/api-auth"
import { buildGenerationRequest, GateError } from "@/lib/deal-context"

export const runtime = "nodejs"
export const maxDuration = 300

// Project-triage in one run — stages 02 (assessment) + 03 (recommendation) of
// workspaces/project-triage, exactly as their contracts verify. Structured
// output keeps the scores and the decision machine-readable, and the run
// produces BOTH documents the stage chain owns: the internal assessment and
// the customer-ready feedback page. Both land as drafts behind the gate.
const triageSchema = z.object({
  fit: z.number().min(0).max(10),
  budget: z.number().min(0).max(10),
  strategicValue: z.number().min(0).max(10),
  weightedTotal: z
    .number()
    .describe("Weighted per the rubric weights in the setup config"),
  buildBuyRedirect: z.enum(["BUILD", "BUY", "REDIRECT"]),
  decision: z.enum(["GO", "REDIRECT", "NO-GO"]),
  assessmentMarkdown: z
    .string()
    .describe(
      "The full internal assessment + recommendation document in markdown, per the stage contracts: per-dimension scores with one-line rationales, weighted total vs the floor, the build/buy/redirect call naming a concrete alternative or 'none found', deal-breaker flags, the decision with Jamie's internal rationale, and the next action"
    ),
  customerFeedbackMarkdown: z
    .string()
    .describe(
      "The customer-ready feedback page in markdown — honest, brand-voice, safe to share even on REDIRECT/NO-GO, no internal margin or rate numbers"
    ),
})

export async function POST(request: Request) {
  const unauthorized = await requireSession()
  if (unauthorized) return unauthorized

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI Gateway is not configured" }, { status: 501 })
  }

  const body = await request.json()
  const dealId = typeof body.dealId === "string" ? body.dealId : ""
  if (!dealId) {
    return Response.json({ error: "dealId is required" }, { status: 400 })
  }

  let req
  try {
    req = await buildGenerationRequest("triage_assessment", dealId)
  } catch (err) {
    if (err instanceof GateError) {
      return Response.json({ error: err.message }, { status: 409 })
    }
    throw err
  }

  const startedAt = Date.now()
  const { object, usage } = await generateObject({
    model: req.model,
    system: req.system,
    prompt: req.prompt,
    schema: triageSchema,
  })
  const latencyMs = Date.now() - startedAt

  // The scores header makes the verdict scannable in the document list even
  // before opening the full rationale.
  const header = [
    `> **Decision: ${object.decision}** · weighted ${object.weightedTotal.toFixed(1)}/10 · ${object.buildBuyRedirect}`,
    `> Fit ${object.fit}/10 · Budget ${object.budget}/10 · Strategic value ${object.strategicValue}/10`,
    "",
  ].join("\n")

  const assessment = await createDocument({
    dealId,
    kind: "triage_assessment",
    title: "Triage assessment",
    contentMd: `${header}\n${object.assessmentMarkdown}`,
  })
  const feedback = await createDocument({
    dealId,
    kind: "customer_feedback",
    title: "Customer feedback",
    contentMd: object.customerFeedbackMarkdown,
  })

  // One run, two artifacts — the provenance row hangs off the assessment (the
  // stage's primary output); the feedback doc's history still shows the run
  // via the same timestamps.
  await recordGeneration({
    dealId,
    documentId: assessment.id,
    kind: "triage_assessment",
    model: req.model,
    stageContractPath: req.contractPath,
    contextFiles: req.contextFiles,
    inputTokens: usage.inputTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    latencyMs,
  })

  return Response.json({
    assessmentId: assessment.id,
    feedbackId: feedback.id,
    decision: object.decision,
  })
}
