// Outreach specs — the client-scoped email drafts (outreach / follow-up /
// chase), one per template in shared/templates/email/. Deliberately NOT
// DocumentKinds: those are deal-pipeline vocabulary (scanned by the deal's
// next-action logic); a touch belongs to the client relationship. Same
// Layer-3 discipline though — each kind lists exactly the files its run loads.

import type { ModelTier } from "./stages"

export type TouchKind = "outreach" | "follow_up" | "chase"

export type OutreachSpec = {
  kind: TouchKind
  /** Human label for the UI. */
  title: string
  /** Layer-3 reference files loaded into the run (repo-relative). */
  layer3: string[]
  /** Model policy — drafting short emails in-voice is standard-tier work. */
  modelTier: ModelTier
}

const VOICE = [
  "_config/brand/voice/tone.md",
  "_config/brand/voice/do-dont.md",
  "_config/brand/voice/vocabulary.md",
]

export const outreachSpecs: Record<TouchKind, OutreachSpec> = {
  // A first touch to a lead who hasn't been engaged yet — grounded in the
  // positioning notes so the pitch angle matches the go-to-market.
  outreach: {
    kind: "outreach",
    title: "Outreach email",
    layer3: [
      "shared/templates/email/outreach.md",
      "workspaces/lead-generation/references/positioning-notes.md",
      "_config/business/rates.md",
      ...VOICE,
    ],
    modelTier: "standard",
  },

  // Nudge a lead who has gone quiet — the stale-lead fix on /today.
  follow_up: {
    kind: "follow_up",
    title: "Follow-up email",
    layer3: ["shared/templates/email/follow-up.md", ...VOICE],
    modelTier: "standard",
  },

  // Chase an unpaid invoice — needs the invoice facts (provided as working
  // material), not the rates.
  chase: {
    kind: "chase",
    title: "Payment chase email",
    layer3: ["shared/templates/email/chase.md", ...VOICE],
    modelTier: "standard",
  },
}

export const touchKinds = Object.keys(outreachSpecs) as TouchKind[]

export function isTouchKind(value: string): value is TouchKind {
  return value in outreachSpecs
}
