// The deal pipeline's three stages, as data. Each stage is its own page under
// /deals/[id]/<slug>; this is the single source of truth for their order,
// slugs, labels, and copy, shared by the hub, the per-stage pages, and the
// stage tab bar. One stage = one job = one page.

export type DealStageSlug = "brainstorm" | "proposal" | "get-paid"

export type DealStage = {
  slug: DealStageSlug
  /** 1-based position in the pipeline. */
  step: number
  /** Full title — page heading and hub tile. */
  title: string
  /** Short label — the stage tab bar (tight, thumb-sized). */
  short: string
  /** One-line description shown on the hub tile and the stage page. */
  blurb: string
}

export const DEAL_STAGES: readonly DealStage[] = [
  {
    slug: "brainstorm",
    step: 1,
    title: "Brainstorm & pitch",
    short: "Pitch",
    blurb:
      "Think the lead's ask through with a web-connected research partner, then draft the pitch you'll present over a coffee.",
  },
  {
    slug: "proposal",
    step: 2,
    title: "Proposal",
    short: "Proposal",
    blurb:
      "The meeting happened — write down what you agreed and the payment structure, and draft the proposal.",
  },
  {
    slug: "get-paid",
    step: 3,
    title: "Get paid",
    short: "Get paid",
    blurb:
      "One Stripe draft invoice per milestone of the approved proposal — send each from Invoices when it falls due.",
  },
] as const

export function getDealStage(slug: string): DealStage | undefined {
  return DEAL_STAGES.find((s) => s.slug === slug)
}

export type DealStageStatus = "done" | "current" | "todo"

/**
 * Where the deal stands in each stage, in order. A stage is "done" once its
 * review gate has been cleared (pitch approved → proposal approved → every
 * milestone invoiced); the first stage that isn't done is the "current" one.
 */
export function dealStageStatuses(state: {
  pitchApproved: boolean
  proposalApproved: boolean
  hasMilestones: boolean
  allMilestonesInvoiced: boolean
}): Record<DealStageSlug, DealStageStatus> {
  const done: Record<DealStageSlug, boolean> = {
    brainstorm: state.pitchApproved,
    proposal: state.proposalApproved,
    "get-paid": state.hasMilestones && state.allMilestonesInvoiced,
  }

  let currentTaken = false
  const result = {} as Record<DealStageSlug, DealStageStatus>
  for (const stage of DEAL_STAGES) {
    if (done[stage.slug]) {
      result[stage.slug] = "done"
    } else if (!currentTaken) {
      result[stage.slug] = "current"
      currentTaken = true
    } else {
      result[stage.slug] = "todo"
    }
  }
  return result
}
