// The dashboard-runnable stage registry. The lead pipeline is deliberately
// tiny — it mirrors how Jamie actually closes work, in three moves:
//
//   1. Brainstorm the lead's ask (web-researched chat) → draft the PITCH he
//      presents informally over a coffee.
//   2. After the meeting, gather what was agreed → draft the PROPOSAL (cost,
//      requirements, terms, how-to-work-with-me) with its payment schedule.
//   3. The approved proposal's payment schedule drives Stripe invoicing.
//
// Only steps 1 and 2 produce documents, so there are exactly two kinds here.
// Each lists the Layer-3 reference files loaded into its run — never the whole
// repo. Editing a listed file changes the next generation with no code change
// (fix the source, not the symptom).

export type DocumentKind = "pitch" | "proposal"

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
    syncPathTemplate: "shared/clients/{slug}/documents/pitch-v{version}.md",
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
    syncPathTemplate: "shared/clients/{slug}/documents/proposal-v{version}.md",
  },
}

export const documentKinds = Object.keys(stageSpecs) as DocumentKind[]

export function isDocumentKind(value: string): value is DocumentKind {
  return value in stageSpecs
}
