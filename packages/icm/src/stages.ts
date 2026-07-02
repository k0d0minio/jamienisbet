// The dashboard-runnable stage registry — the bridge between the ICM folders
// and the admin pipeline. Each generatable document kind maps 1:1 onto the ICM
// stage whose CONTEXT.md governs it ("one stage = one job"), and lists exactly
// the Layer-3 files that contract names as Inputs. The context assembler loads
// only these files — never the whole repo — mirroring how an agent run walks
// the workspace. Editing a listed file changes the next generation with no
// code change (fix the source, not the symptom).

export type DocumentKind =
  | "triage_assessment"
  | "customer_feedback"
  | "project_outline"
  | "brd"
  | "proposal"
  | "quote"
  | "negotiation_strategy"
  | "mockup"

export type ModelTier = "heavy" | "standard" | "fast"

export type StageSpec = {
  kind: DocumentKind
  /** Human label used in the UI and as the default document title. */
  title: string
  /** Repo-relative path of the governing CONTEXT.md, or null for the two
   * dashboard-native kinds (project_outline, mockup) that have no workspace
   * stage yet. Recorded on every generation for provenance. */
  contractPath: string | null
  /** Extra stage contracts folded into the same run (triage runs 02+03). */
  extraContractPaths?: string[]
  /** Layer-3 reference files the contract names as Inputs (repo-relative). */
  layer3: string[]
  /** Apply _config/brand/voice/ and write for the customer to read. */
  customerFacing: boolean
  /** Never client-facing — internal coaching/strategy material. */
  privateDoc: boolean
  /** Must render the contabilista/lawyer decision-support disclaimer. */
  disclaimer: boolean
  /** Model policy per _config/conventions/model-and-scaling.md. */
  modelTier: ModelTier
  /** Where an approved artifact syncs back to in the repo. `{slug}` is the
   * client slug, `{version}` the document version. */
  syncPathTemplate: string
}

const VOICE = [
  "_config/brand/voice/tone.md",
  "_config/brand/voice/do-dont.md",
  "_config/brand/voice/vocabulary.md",
]

export const stageSpecs: Record<DocumentKind, StageSpec> = {
  // Runs project-triage stages 02 (assessment) + 03 (recommendation) in one
  // pass: score → decide → also emit the customer_feedback document.
  triage_assessment: {
    kind: "triage_assessment",
    title: "Triage assessment",
    contractPath: "workspaces/project-triage/stages/02_assessment/CONTEXT.md",
    extraContractPaths: [
      "workspaces/project-triage/stages/03_recommendation/CONTEXT.md",
    ],
    layer3: [
      "workspaces/project-triage/references/scoring-rubric.md",
      "workspaces/project-triage/references/existing-solutions-heuristics.md",
      "workspaces/project-triage/references/decision-criteria.md",
      "workspaces/project-triage/setup/output/config.md",
      ...VOICE,
    ],
    customerFacing: false,
    privateDoc: false,
    disclaimer: false,
    modelTier: "heavy",
    syncPathTemplate:
      "workspaces/project-triage/stages/02_assessment/output/assessment-{slug}.md",
  },

  // Produced by the same triage run — registered separately so it has its own
  // review gate, sync path, and can be regenerated on its own.
  customer_feedback: {
    kind: "customer_feedback",
    title: "Customer feedback",
    contractPath:
      "workspaces/project-triage/stages/03_recommendation/CONTEXT.md",
    layer3: [
      "workspaces/project-triage/references/decision-criteria.md",
      "workspaces/project-triage/setup/output/config.md",
      ...VOICE,
    ],
    customerFacing: true,
    privateDoc: false,
    disclaimer: false,
    modelTier: "standard",
    syncPathTemplate:
      "workspaces/project-triage/stages/03_recommendation/output/customer-feedback-{slug}.md",
  },

  // Dashboard-native: crystallised out of the technical workshop chat. No
  // workspace stage owns it yet; rates ground the effort bands.
  project_outline: {
    kind: "project_outline",
    title: "Project outline",
    contractPath: null,
    layer3: ["_config/business/rates.md"],
    customerFacing: false,
    privateDoc: false,
    disclaimer: false,
    modelTier: "heavy",
    syncPathTemplate: "shared/clients/{slug}/documents/project-outline-v{version}.md",
  },

  // Customer-consumable translation of the approved project outline.
  brd: {
    kind: "brd",
    title: "Business requirements document",
    contractPath: null,
    layer3: ["shared/templates/brd.md", ...VOICE],
    customerFacing: true,
    privateDoc: false,
    disclaimer: false,
    modelTier: "standard",
    syncPathTemplate: "shared/clients/{slug}/documents/brd-v{version}.md",
  },

  proposal: {
    kind: "proposal",
    title: "Proposal",
    contractPath: "workspaces/proposals/stages/04_proposal/CONTEXT.md",
    layer3: [
      "shared/templates/proposal.md",
      "workspaces/proposals/setup/output/config.md",
      "_config/business/rates.md",
      ...VOICE,
    ],
    customerFacing: true,
    privateDoc: false,
    disclaimer: true,
    modelTier: "standard",
    syncPathTemplate:
      "workspaces/proposals/stages/04_proposal/output/{slug}/proposal.md",
  },

  quote: {
    kind: "quote",
    title: "Quote",
    contractPath: "workspaces/proposals/stages/05_quote/CONTEXT.md",
    layer3: [
      "shared/templates/quote.md",
      "workspaces/proposals/references/pricing-models.md",
      "workspaces/proposals/setup/output/config.md",
      "_config/business/rates.md",
      ...VOICE,
    ],
    customerFacing: true,
    privateDoc: false,
    disclaimer: true,
    modelTier: "standard",
    syncPathTemplate:
      "workspaces/proposals/stages/05_quote/output/{slug}/quote.md",
  },

  // CRITICAL-gated stage 03. Private: coaching material for Jamie only, never
  // sent to a client; the proposal generator refuses to run without an
  // approved one (the contract's "no document until signed off").
  negotiation_strategy: {
    kind: "negotiation_strategy",
    title: "Negotiation strategy",
    contractPath:
      "workspaces/proposals/stages/03_negotiation_strategy/CONTEXT.md",
    layer3: [
      "workspaces/proposals/references/negotiation-playbook.md",
      "workspaces/proposals/references/pricing-models.md",
      "workspaces/proposals/setup/output/config.md",
    ],
    customerFacing: false,
    privateDoc: true,
    disclaimer: false,
    modelTier: "heavy",
    syncPathTemplate:
      "workspaces/proposals/stages/03_negotiation_strategy/output/{slug}/negotiation-strategy.md",
  },

  // Self-contained HTML concept pages, styled from the design-system tokens so
  // the brand is never forked per surface.
  mockup: {
    kind: "mockup",
    title: "Mockup",
    contractPath: null,
    layer3: [
      "packages/ui/tokens/colors.css",
      "packages/ui/tokens/typography.css",
      "packages/ui/tokens/radius.css",
    ],
    customerFacing: true,
    privateDoc: false,
    disclaimer: false,
    modelTier: "standard",
    syncPathTemplate: "shared/clients/{slug}/documents/mockup-v{version}.html",
  },
}

export const documentKinds = Object.keys(stageSpecs) as DocumentKind[]

export function isDocumentKind(value: string): value is DocumentKind {
  return value in stageSpecs
}
