// The dashboard-runnable stage registry — the code side of the ICM deal
// pipeline. Each kind is one job that mirrors a workspace stage contract, and
// lists exactly the Layer-3 reference files that contract names as Inputs.
// Editing a listed file changes the next generation with no code change (fix
// the source, not the symptom). The kinds, in the order a deal moves through
// them:
//
//   triage       decide if the work is worth it (go/no-go + a shareable note)
//   pitch        prep for the informal first meeting, drafted from the brainstorm
//   negotiation  internal rate-lift strategy for the pricing conversation
//   proposal     the client-facing write-up of what was agreed, + payment schedule
//   contract     the legal agreement, drawn from the approved proposal
//
// Deliberately NOT document kinds: quote and invoice. The deal's payment
// schedule (stored structured on the deal) is the quote, and Stripe is the
// invoice — the get-paid stage drives both. Adding markdown quote/invoice kinds
// would create a second source of truth for money; the payment schedule and
// Stripe stay authoritative.

export type DocumentKind =
  | "triage"
  | "pitch"
  | "negotiation"
  | "proposal"
  | "contract"

export type ModelTier = "heavy" | "standard" | "fast"

export type StageSpec = {
  kind: DocumentKind
  /** Human label used in the UI and as the default document title. */
  title: string
  /** Layer-3 reference files loaded into the run (repo-relative). */
  layer3: string[]
  /** Apply _config/brand/voice/ and write for the customer to read. */
  customerFacing: boolean
  /** Must render the contabilista/lawyer decision-support disclaimer. */
  disclaimer: boolean
  /** Model policy per _config/conventions/model-and-scaling.md. */
  modelTier: ModelTier
}

const VOICE = [
  "_config/brand/voice/tone.md",
  "_config/brand/voice/do-dont.md",
  "_config/brand/voice/vocabulary.md",
]

export const stageSpecs: Record<DocumentKind, StageSpec> = {
  // Fast go/no-go before any effort goes in — the project-triage rubric applied
  // to the lead. Mostly Jamie's internal call, but it ends with an honest,
  // brand-safe note he can share even on a redirect/no-go, so the run loads the
  // voice too. Heavy tier: the judgement (fit, budget, build-vs-buy) is the
  // whole value.
  triage: {
    kind: "triage",
    title: "Fit assessment",
    layer3: [
      "workspaces/project-triage/references/scoring-rubric.md",
      "workspaces/project-triage/references/decision-criteria.md",
      "workspaces/project-triage/references/existing-solutions-heuristics.md",
      "workspaces/project-triage/setup/output/config.md",
      "_config/business/rates.md",
      ...VOICE,
    ],
    customerFacing: false,
    disclaimer: false,
    modelTier: "heavy",
  },

  // Crystallised out of the brainstorm chat: Jamie's own prep for presenting
  // the idea informally. Internal document — technical language is fine.
  pitch: {
    kind: "pitch",
    title: "Pitch",
    layer3: [
      "_config/business/rates.md",
      "workspaces/proposals/references/discovery-questions.md",
    ],
    customerFacing: false,
    disclaimer: false,
    modelTier: "heavy",
  },

  // Internal-only prep for the pricing conversation: anchor, target, floor, the
  // tiered options and the talk-track. Never sent — it exists to walk Jamie
  // into the room ready to hold his rate. Heavy tier (this is the flagship
  // "lift the rate" judgement).
  negotiation: {
    kind: "negotiation",
    title: "Negotiation strategy",
    layer3: [
      "workspaces/proposals/references/negotiation-playbook.md",
      "workspaces/proposals/references/pricing-models.md",
      "workspaces/proposals/setup/output/config.md",
      "_config/business/rates.md",
    ],
    customerFacing: false,
    disclaimer: false,
    modelTier: "heavy",
  },

  // Drafted from what Jamie and the client agreed at the meeting. The one
  // client-facing document of the pipeline; its payment schedule (stored
  // structured on the deal) is what Stripe invoicing later executes.
  proposal: {
    kind: "proposal",
    title: "Proposal",
    layer3: [
      "shared/templates/proposal.md",
      "_config/business/rates.md",
      ...VOICE,
    ],
    customerFacing: true,
    disclaimer: true,
    modelTier: "standard",
  },

  // The legal agreement, populated from the approved proposal and the entity
  // facts. Formal, not brand-voice-y (customerFacing is false so the chatty
  // voice is NOT applied), but it always carries the decision-support notice —
  // it is MANDATORY that a lawyer / contabilista reviews it before it is sent.
  contract: {
    kind: "contract",
    title: "Contract",
    layer3: [
      "shared/templates/contract.md",
      "_config/business/contact.md",
      "_config/business/rates.md",
    ],
    customerFacing: false,
    disclaimer: true,
    modelTier: "standard",
  },
}

export const documentKinds = Object.keys(stageSpecs) as DocumentKind[]

export function isDocumentKind(value: string): value is DocumentKind {
  return value in stageSpecs
}
