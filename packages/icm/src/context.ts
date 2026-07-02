// The context assembler — builds the system prompt for one stage run exactly
// the way an agent walks a workspace: the stage's CONTEXT.md contract first,
// then only the Layer-3 references that contract names. Layer-4 (the client,
// the deal, prior approved documents) is per-run working material and is
// supplied by the caller as the user prompt — this module never touches the
// database.

import { readRepoFile, tryReadRepoFile } from "./repo"
import { stageSpecs, type DocumentKind } from "./stages"

export type StageContext = {
  system: string
  /** Governing contract path (provenance, recorded per generation). */
  contractPath: string | null
  /** Every repo file actually loaded into the context. */
  files: string[]
}

const ENGINE_PREAMBLE = `You are the document engine for Jamie Nisbet — a software engineer / AI consultant in Mafra, Portugal. You are executing one stage of his ICM (Interpretable Context Methodology) pipeline from inside the admin dashboard.

Ground rules, always:
- Do exactly the one job the stage contract below describes — nothing more.
- Ground every figure, rate, and claim in the reference files provided. Never invent business facts.
- Output is a DRAFT for Jamie's review. It is never sent anywhere without his explicit approval.
- Legal / tax / financial content is decision-support only, and must say so where the rules below require it.`

const DISCLAIMER_RULE =
  "- End the document with a short note that pricing/tax/legal treatment is decision-support and must be confirmed by a licensed Portuguese contabilista certificado (and a lawyer for contractual terms) before it is sent."

const VOICE_RULE =
  "- This document is customer-facing: apply the brand voice references exactly (friendly, informative, first person, UK/EU spelling, no corporate filler). Write to one reader — \"you\"."

const PRIVATE_RULE =
  "- This document is PRIVATE coaching material for Jamie only. It must never be shared with the client. Be direct and on Jamie's side: name the anchor, the target, the floor, and the walk-away triggers plainly."

// Per-kind output instructions the stage contracts don't spell out (they were
// written for file-based agent runs; these adapt the same job to a dashboard
// document). Keep these thin — the real rules live in the repo files.
const OUTPUT_RULES: Record<DocumentKind, string> = {
  triage_assessment:
    "- Produce the assessment exactly as the 02_assessment contract verifies: each of fit / budget / strategic value scored with a one-line rationale, the weighted total against the configured floor, a BUILD / BUY / REDIRECT call naming at least one concrete alternative (or \"none found\"), any deal-breaker flagged, and finish with the 03_recommendation decision: GO / REDIRECT / NO-GO plus Jamie's internal rationale and next action.",
  customer_feedback:
    "- Produce the customer-ready feedback page the 03_recommendation contract describes: honest, brand-consistent, safe to share even on a REDIRECT/NO-GO, and containing no internal margin or rate numbers.",
  project_outline:
    "- Produce a technical project outline: the problem and goal, a proposed architecture (components, integrations, data flow), delivery phases with rough effort bands in hours grounded in the standard rate, key risks and unknowns, and open questions for the client. This is an internal working document — technical language is fine.",
  brd:
    "- Fill the BRD template's structure for the client to consume: translate the technical outline into business language (goals, scope, deliverables, acceptance criteria, timeline, assumptions and exclusions). No internal rates, margins, or effort maths.",
  proposal:
    "- Fill the proposal template's structure and {{token}} slots with this deal's specifics: the client's problem, the outcome, tiered good/better/best options consistent with the approved negotiation strategy, and value framing. Prices come from the strategy's tiers — never below the configured floor.",
  quote:
    "- Fill the quote template's structure: line items reconciling to the proposal scope, headline price equal to the strategy target and never below the floor, deposit and net-days terms from the setup config, and the correct IVA note for the client's country per the pricing-models reference.",
  negotiation_strategy:
    "- Produce the strategy the 03_negotiation_strategy contract verifies: anchor / target / floor (target at or above the standard rate, never below the configured floor), tiered options, value-vs-cost framing, objection responses, hold/walk triggers, and an exact talk-track for the opening, the anchor, and pushback.",
  mockup:
    "- Produce ONE complete, self-contained HTML document and nothing else — no markdown fences, no commentary before or after. Inline all CSS in a <style> tag. Define and use the brand's CSS custom properties from the token files provided (colors, typography scale, radius). No external requests of any kind: no CDN links, no web fonts (use the token font stacks with system fallbacks), no remote images (use inline SVG or CSS shapes). No JavaScript. Make it responsive and presentable as a concept the client can react to.",
}

function section(label: string, path: string, body: string): string {
  return `\n\n---\n## ${label}: ${path}\n\n${body.trim()}`
}

/**
 * Assemble the Layer 0–3 context for one document kind. Optional references
 * that are missing are skipped silently; the contract and templates are
 * required and throw (a wrong path should fail loudly, not degrade quietly).
 */
export function assembleStageContext(kind: DocumentKind): StageContext {
  const spec = stageSpecs[kind]
  const files: string[] = []
  let system = ENGINE_PREAMBLE

  const contracts = [
    ...(spec.contractPath ? [spec.contractPath] : []),
    ...(spec.extraContractPaths ?? []),
  ]
  for (const path of contracts) {
    system += section("Stage contract (Layer 2)", path, readRepoFile(path))
    files.push(path)
  }
  if (contracts.length === 0) {
    system +=
      "\n\n---\n## Stage contract\n\nThis is a dashboard-native document kind with no workspace stage yet; follow the output rules below."
  }

  for (const path of spec.layer3) {
    const body = tryReadRepoFile(path)
    if (body === null) continue
    system += section("Reference (Layer 3)", path, body)
    files.push(path)
  }

  const rules = [OUTPUT_RULES[kind]]
  if (spec.customerFacing) rules.push(VOICE_RULE)
  if (spec.privateDoc) rules.push(PRIVATE_RULE)
  if (spec.disclaimer) rules.push(DISCLAIMER_RULE)
  if (kind !== "mockup") {
    rules.push(
      "- Output plain markdown only — the document body itself, no preamble, no code fences around the whole document."
    )
  }
  system += `\n\n---\n## Output rules\n\n${rules.join("\n")}`

  return { system, contractPath: spec.contractPath, files }
}
