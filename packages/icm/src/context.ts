// The context assembler — builds the system prompt for one document run the
// way an agent walks a workspace: the run's job first, then only the Layer-3
// references the stage names. Layer-4 (the client, the deal, the brainstorm,
// what was agreed at the meeting) is per-run working material and is supplied
// by the caller as the user prompt — this module never touches the database.

import { tryReadRepoFile } from "./repo"
import { stageSpecs, type DocumentKind } from "./stages"

export type StageContext = {
  system: string
  /** Every repo file actually loaded into the context. */
  files: string[]
}

const ENGINE_PREAMBLE = `You are the document engine for Jamie Nisbet — a software engineer / AI consultant in Mafra, Portugal. You are drafting one document of his deal pipeline from inside the admin dashboard.

Ground rules, always:
- Do exactly the one job described below — nothing more.
- Ground every figure, rate, and claim in the reference files provided. Never invent business facts.
- Output is a DRAFT for Jamie's review. It is never sent anywhere without his explicit approval.
- Legal / tax / financial content is decision-support only, and must say so where the rules below require it.`

const DISCLAIMER_RULE =
  "- End the document with a short note that pricing/tax/legal treatment is decision-support and must be confirmed by a licensed Portuguese contabilista certificado (and a lawyer for contractual terms) before it is sent."

const VOICE_RULE =
  "- This document is customer-facing: apply the brand voice references exactly (friendly, informative, first person, UK/EU spelling, no corporate filler). Write to one reader — \"you\"."

// Per-kind output instructions — the job description for each document the
// pipeline produces. Keep these thin — the real rules live in the repo files.
const OUTPUT_RULES: Record<DocumentKind, string> = {
  triage:
    "- Produce Jamie's FIT ASSESSMENT — a fast go/no-go on whether this work is worth taking. Apply the scoring rubric and decision criteria in the references: (1) score the deal on each rubric dimension with a one-line justification, and give the weighted total; (2) check the hard deal-breakers explicitly; (3) a BUILD / BUY / REDIRECT scan — is there an existing solution the client should use instead?; (4) a clear verdict: GO, REDIRECT, or NO-GO, with the single most important reason; (5) end with a short, honest CUSTOMER-READY NOTE (under a '## Customer-ready note' heading) that Jamie could share as-is — even on a REDIRECT or NO-GO — containing NO internal margin, rate, or capacity numbers. Everything above that heading is internal; technical and commercial language is fine there.",
  pitch:
    "- Produce Jamie's PITCH PREP for an informal first meeting (a coffee or a drink, not a boardroom): (1) the lead's ask in one paragraph, as Jamie understands it; (2) what the research found — the market, existing/competing solutions, and anything that changes the shape of the build; (3) two or three concrete solution directions, each with a rough effort band in hours grounded in the standard rate and a plain-language sketch of how it would work; (4) the questions to ask over coffee that most change the design or the price (lean on the discovery-questions reference); (5) Jamie's recommended angle — the direction to pitch and why. This is an internal working document; technical language is fine.",
  negotiation:
    "- Produce Jamie's INTERNAL NEGOTIATION STRATEGY for the pricing conversation — this is never sent to the client. Following the negotiation playbook and pricing models: (1) set the anchor, target, and floor as explicit numbers — the target must be at least the standard rate and never below the configured floor; (2) build two or three tiered options (good / better / best) with what each includes; (3) frame value-vs-cost in the client's terms; (4) prepare responses to the objections most likely here; (5) define the hold and walk-away triggers; (6) write an exact talk-track for the opening, stating the anchor, and handling pushback. Ground every tactic in this deal's specifics. Internal document — be direct about leverage and numbers.",
  proposal:
    "- Fill the proposal template's structure with this deal's specifics, drawing on what Jamie agreed with the client at the meeting (provided in the working material). The payment schedule given there is AUTHORITATIVE — reproduce its milestones and amounts exactly; never invent, split, or reprice them. Cover: the agreed solution and its cost, the business requirements, the technical requirements, the basic terms of working with Jamie, and the short 'how we work together' communication brief (bundle small requests, agreed scope is the scope — change requests are quoted separately).",
  contract:
    "- Populate the contract template with this deal's specifics, drawn from the APPROVED PROPOSAL provided in the working material (the agreed scope, price and payment schedule are authoritative — reproduce them exactly, never reprice or re-scope). Fill the parties, scope, price, payment schedule and milestones, IP and confidentiality, and termination. Use the business entity facts from the references; where an entity fact is not yet on file (e.g. NIF, IBAN, registered address), leave the template's placeholder token in place rather than inventing a value. Plain, precise contractual language — not marketing copy.",
}

function section(label: string, path: string, body: string): string {
  return `\n\n---\n## ${label}: ${path}\n\n${body.trim()}`
}

/**
 * Assemble the Layer 0–3 context for one document kind. References that are
 * missing are skipped silently (the run degrades, the output rules still
 * carry the job).
 */
export function assembleStageContext(kind: DocumentKind): StageContext {
  const spec = stageSpecs[kind]
  const files: string[] = []
  let system = ENGINE_PREAMBLE

  for (const path of spec.layer3) {
    const body = tryReadRepoFile(path)
    if (body === null) continue
    system += section("Reference (Layer 3)", path, body)
    files.push(path)
  }

  const rules = [OUTPUT_RULES[kind]]
  if (spec.customerFacing) rules.push(VOICE_RULE)
  if (spec.disclaimer) rules.push(DISCLAIMER_RULE)
  rules.push(
    "- Output plain markdown only — the document body itself, no preamble, no code fences around the whole document."
  )
  system += `\n\n---\n## Output rules\n\n${rules.join("\n")}`

  return { system, files }
}
