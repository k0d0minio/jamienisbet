// The stage-aware "what now?" for a deal — the dashboard's reading of the
// macro-pipeline (_config/conventions/macro-pipeline.md) against what has
// actually been approved. Reviewing a pending draft always outranks
// generating the next thing: the review gates are the pipeline.

import { kindLabel } from "./kinds"

export type DocSummary = { id: string; kind: string; status: string }

export type NextAction = {
  kind: "review" | "generate" | "invoice" | "done"
  title: string
  description: string
  /** For "review": the document to open. */
  documentId?: string
}

// The order the artifact chain unlocks in.
const CHAIN: { kind: string; title: string; description: string }[] = [
  {
    kind: "triage_assessment",
    title: "Run triage",
    description:
      "Score fit, budget, and strategic value first — the GO/NO-GO gates everything after it.",
  },
  {
    kind: "project_outline",
    title: "Workshop it, then crystallise an outline",
    description:
      "Brainstorm the build in the technical workshop and crystallise it into a project outline.",
  },
  {
    kind: "negotiation_strategy",
    title: "Generate the negotiation strategy",
    description:
      "Anchor, target, floor, and talk-track — the CRITICAL gate before any client document exists.",
  },
  {
    kind: "proposal",
    title: "Draft the proposal",
    description: "The strategy is signed off — put the offer in front of the client.",
  },
  {
    kind: "quote",
    title: "Draft the quote",
    description: "Price the approved proposal at the strategy's target.",
  },
]

export function nextActionFor(docs: DocSummary[]): NextAction {
  const pending = docs.find(
    (d) => d.status === "draft" || d.status === "in_review"
  )
  if (pending) {
    return {
      kind: "review",
      title: `Review the ${kindLabel(pending.kind).toLowerCase()} draft`,
      description:
        "A draft is waiting for you — approve, edit, or reject it. Nothing moves until it's reviewed.",
      documentId: pending.id,
    }
  }

  const approved = new Set(
    docs.filter((d) => d.status === "approved").map((d) => d.kind)
  )
  for (const step of CHAIN) {
    if (!approved.has(step.kind)) {
      return { kind: "generate", title: step.title, description: step.description }
    }
  }

  if (approved.has("quote")) {
    return {
      kind: "invoice",
      title: "Raise the draft invoice",
      description:
        "The quote is approved — create the Stripe draft (it is never sent automatically). A BRD and mockups can round out the handoff.",
    }
  }

  return {
    kind: "done",
    title: "Pipeline complete",
    description: "Everything in the chain is approved. Mark the deal won or lost.",
  }
}
