// The "what now?" for a deal — the dashboard's reading of the three-step
// pipeline (brainstorm & pitch → proposal → get paid) against what has
// actually happened. Reviewing a pending draft always outranks generating
// the next thing: the review gates are the pipeline.

import type { PaymentMilestone } from "@jamie-nisbet/services"

import { kindLabel } from "./kinds"

export type DocSummary = { id: string; kind: string; status: string }

export type NextAction = {
  kind: "review" | "brainstorm" | "proposal" | "invoice" | "done"
  title: string
  description: string
  /** For "review": the document to open. */
  documentId?: string
}

export function nextActionFor(
  docs: DocSummary[],
  milestones: PaymentMilestone[]
): NextAction {
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

  if (!approved.has("pitch")) {
    return {
      kind: "brainstorm",
      title: "Brainstorm it, then draft the pitch",
      description:
        "Step 1 — research the ask with the brainstorm and draft the pitch you'll present over coffee.",
    }
  }

  if (!approved.has("proposal")) {
    return {
      kind: "proposal",
      title: "Draft the proposal",
      description:
        "Step 2 — the meeting happened: write down what you agreed and the payment structure, and draft the proposal.",
    }
  }

  if (milestones.some((m) => !m.stripeInvoiceId)) {
    return {
      kind: "invoice",
      title: "Invoice the next milestone",
      description:
        "Step 3 — the proposal is approved. Raise the Stripe draft for the next milestone due (it is never sent automatically).",
    }
  }

  return {
    kind: "done",
    title: "Pipeline complete",
    description:
      "Every milestone is invoiced — chase payment from Invoices and mark the deal won.",
  }
}
