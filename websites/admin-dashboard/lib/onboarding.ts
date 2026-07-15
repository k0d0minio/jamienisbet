// The won-deal onboarding checklist — what turns "won" into "delivering".
// Mirrors lib/next-action.ts in spirit: everything that CAN be derived from
// existing facts is derived here at read time (contract approved, deposit
// invoiced, repo created); only human confirmations the data can't witness
// (contract sent, repo seeded, kickoff scheduled) come from the deal's stored
// onboarding state. Every step is human-clicked — winning a deal triggers no
// outbound side effect on its own.

import type {
  Client,
  Deal,
  OnboardingState,
  OnboardingStepKey,
  PaymentMilestone,
} from "@jamie-nisbet/services"

import type { DocSummary } from "./next-action"

export type OnboardingItem = {
  key: string
  label: string
  description: string
  done: boolean
  /** ISO timestamp for stored confirmations (undefined for derived facts). */
  doneAt?: string
  /** "derived" facts are read-only here; "stored" steps toggle via the
   * checklist; "seed" renders the create-and-seed repo button. */
  kind: "derived" | "stored" | "seed"
  /** For stored steps: the key markOnboardingStepAction writes. */
  stepKey?: OnboardingStepKey
  /** Deep link to where a not-done derived step is done. */
  href?: string
}

export function onboardingFor(input: {
  deal: Deal
  client: Client | undefined
  docs: DocSummary[]
  milestones: PaymentMilestone[]
  state: OnboardingState
}): OnboardingItem[] {
  const { deal, client, docs, milestones, state } = input

  const contractApproved = docs.some(
    (d) => d.kind === "contract" && d.status === "approved"
  )
  const depositInvoiced =
    milestones.length > 0 && Boolean(milestones[0].stripeInvoiceId)
  const repoCreated = Boolean(client?.githubRepo)

  return [
    {
      key: "contract_approved",
      label: "Contract approved",
      description:
        "The contract draft is reviewed and approved (it still needs your lawyer/contabilista's eyes before it goes out).",
      done: contractApproved,
      kind: "derived",
      href: `/deals/${deal.id}/documents`,
    },
    {
      key: "contract_sent",
      label: "Contract sent to the client",
      description: "You sent the approved contract from your own email.",
      done: Boolean(state.contractSentAt),
      doneAt: state.contractSentAt,
      kind: "stored",
      stepKey: "contractSentAt",
    },
    {
      key: "deposit_invoiced",
      label:
        deal.billingType === "retainer"
          ? "First invoice raised"
          : "Deposit invoiced",
      description:
        milestones.length === 0
          ? "No payment schedule yet — the proposal step writes it, get-paid raises the invoices."
          : "The first milestone has its Stripe draft invoice raised in get-paid.",
      done: depositInvoiced,
      kind: "derived",
      href: `/deals/${deal.id}/get-paid`,
    },
    {
      key: "repo_created",
      label: "Delivery repo connected",
      description: client?.githubRepo
        ? `Connected to ${client.githubRepo}.`
        : "The client's own GitHub repo, created or connected from their profile — or by the seed step below.",
      done: repoCreated,
      kind: "derived",
      href: `/clients/${deal.clientId}`,
    },
    {
      key: "repo_seeded",
      label: "Delivery repo seeded",
      description:
        "The discovery / build / delivery stage docs from shared/templates/delivery/ are committed into the client repo (docs/icm/).",
      done: Boolean(state.repoSeededAt),
      doneAt: state.repoSeededAt,
      kind: "seed",
      stepKey: "repoSeededAt",
    },
    {
      key: "kickoff_scheduled",
      label: "Kickoff scheduled",
      description: "The kickoff call/meeting is in the calendar.",
      done: Boolean(state.kickoffScheduledAt),
      doneAt: state.kickoffScheduledAt,
      kind: "stored",
      stepKey: "kickoffScheduledAt",
    },
  ]
}
