import "server-only"

import {
  getClient,
  getDeal,
  getLatestApprovedDocument,
  listWorkshopMessages,
  type Client,
  type Deal,
  type Document,
  type PaymentMilestone,
} from "@jamie-nisbet/services"
import {
  assembleStageContext,
  modelFor,
  stageSpecs,
  type DocumentKind,
} from "@jamie-nisbet/icm"

import { formatMoney } from "@/lib/money"
import { kindLabel } from "@/lib/kinds"
import { getRepoSnapshot } from "@/lib/github"

/**
 * Layer-4 assembly for the pipeline's AI runs — the client, the deal, and the
 * working material each document kind builds on:
 *
 *   triage      ← the intake (+ the client's repo, if connected)
 *   pitch       ← the intake + the brainstorm transcript
 *   negotiation ← the intake + the brainstorm + the approved pitch (if any)
 *   proposal    ← the intake + the approved pitch (if any) + what Jamie agreed
 *                 with the client at the meeting (his form input, authoritative)
 *   contract    ← the intake + the approved proposal (its scope/price/schedule)
 */

export function clientSection(client: Client): string {
  const lines = [
    `- Name: ${client.name}`,
    client.company ? `- Company: ${client.company}` : null,
    client.email ? `- Email: ${client.email}` : null,
    client.phone ? `- Phone: ${client.phone}` : null,
    `- Source: ${client.source}`,
    client.budget ? `- Indicated budget: ${client.budget}` : null,
    client.intakeMessage
      ? `- Intake message:\n\n${client.intakeMessage}`
      : "- Intake message: (none recorded)",
    client.notes ? `- Jamie's working notes:\n\n${client.notes}` : null,
  ].filter(Boolean)
  return `## Client\n${lines.join("\n")}`
}

function dealSection(deal: Deal): string {
  const lines = [
    "## Deal",
    `- Title: ${deal.title}`,
    `- Status: ${deal.status}`,
  ]
  if (deal.billingType === "retainer") {
    lines.push(
      `- Billing: recurring retainer, ${
        deal.recurringAmountMinor > 0
          ? formatMoney(deal.recurringAmountMinor, "eur")
          : "amount not set yet"
      } per ${deal.recurringInterval}${
        deal.activeUntil
          ? ` until ${deal.activeUntil.toISOString().slice(0, 10)}`
          : " (open-ended)"
      }`
    )
  } else {
    lines.push(
      `- Billing: one-off project`,
      `- Working value: ${
        deal.valueMinor > 0 ? formatMoney(deal.valueMinor, "eur") : "not set yet"
      }`
    )
  }
  return lines.join("\n")
}

function documentSection(doc: Document): string {
  return `## ${kindLabel(doc.kind)} (approved, v${doc.version})\n\n${
    doc.contentMd ?? doc.contentHtml ?? ""
  }`
}

/**
 * Snapshot of the client's connected delivery repo (README, file tree, stack),
 * or null when none is connected / GitHub is unconfigured / the read fails. This
 * is what makes the pipeline's suggestions codebase-aware: the same snapshot
 * feeds the brainstorm, pitch, and proposal runs. Best-effort by design — a repo
 * hiccup never blocks a generation.
 */
async function repoSection(client: Client): Promise<string | null> {
  if (!client.githubRepo) return null
  try {
    return await getRepoSnapshot(client.githubRepo, client.githubDefaultBranch)
  } catch {
    return null
  }
}

async function brainstormSection(dealId: string): Promise<string | null> {
  const messages = await listWorkshopMessages(dealId)
  if (messages.length === 0) return null
  const transcript = messages
    .map((m) => `**${m.role === "user" ? "Jamie" : "Assistant"}:** ${m.content}`)
    .join("\n\n")
  return `## Brainstorm transcript\n\n${transcript}`
}

/** What Jamie agreed with the client — the proposal form's input, passed
 * through verbatim as the authoritative working material. */
export type ProposalInputs = {
  /** The plan as agreed at the meeting: solution, scope, key requirements. */
  agreedPlan: string
  /** Timeline agreed or expected (free text). */
  timeline?: string
  /** Anything else to fold in. */
  notes?: string
  /** The agreed payment structure — reproduced exactly in the document and
   * stored on the deal for the invoicing step. */
  milestones: Pick<PaymentMilestone, "label" | "amountMinor">[]
}

function agreementSection(inputs: ProposalInputs): string {
  const schedule = inputs.milestones
    .map((m) => `| ${m.label} | ${formatMoney(m.amountMinor, "eur")} |`)
    .join("\n")
  const total = inputs.milestones.reduce((sum, m) => sum + m.amountMinor, 0)
  return [
    "## What Jamie agreed with the client (authoritative)",
    "",
    inputs.agreedPlan.trim(),
    inputs.timeline?.trim() ? `\n**Timeline:** ${inputs.timeline.trim()}` : null,
    inputs.notes?.trim() ? `\n**Additional notes:**\n\n${inputs.notes.trim()}` : null,
    "",
    "**Agreed payment schedule (reproduce exactly):**",
    "",
    "| Milestone | Amount |",
    "|---|---|",
    schedule,
    `| **Total** | **${formatMoney(total, "eur")}** |`,
  ]
    .filter((s): s is string => s !== null)
    .join("\n")
}

export type GenerationRequest = {
  deal: Deal
  client: Client
  kind: DocumentKind
  model: string
  system: string
  prompt: string
  contextFiles: string[]
  title: string
}

export async function buildGenerationRequest(
  kind: DocumentKind,
  dealId: string,
  opts: { instructions?: string; proposalInputs?: ProposalInputs } = {}
): Promise<GenerationRequest> {
  const deal = await getDeal(dealId)
  if (!deal) throw new Error("That deal no longer exists.")
  const client = await getClient(deal.clientId)
  if (!client) throw new Error("That deal's client no longer exists.")

  const spec = stageSpecs[kind]
  const stage = assembleStageContext(kind)

  const sections: string[] = [
    "# Working material (Layer 4)",
    clientSection(client),
    dealSection(deal),
  ]

  // The client's codebase, when they have one connected — grounds the whole run.
  const repo = await repoSection(client)
  if (repo) sections.push(repo)

  // triage runs first, on the intake alone — nothing upstream to fold in.

  if (kind === "pitch" || kind === "negotiation") {
    const brainstorm = await brainstormSection(dealId)
    if (brainstorm) sections.push(brainstorm)
  }

  // The negotiation prep builds on the pitch's read of the opportunity.
  if (kind === "negotiation") {
    const pitch = await getLatestApprovedDocument(dealId, "pitch")
    if (pitch) sections.push(documentSection(pitch))
  }

  if (kind === "proposal") {
    const pitch = await getLatestApprovedDocument(dealId, "pitch")
    if (pitch) sections.push(documentSection(pitch))
    if (!opts.proposalInputs) {
      throw new Error("A proposal run needs the meeting's agreed inputs.")
    }
    sections.push(agreementSection(opts.proposalInputs))
  }

  // The contract is drawn from the approved proposal — its scope, price and
  // payment schedule are authoritative and must not be re-derived.
  if (kind === "contract") {
    const proposal = await getLatestApprovedDocument(dealId, "proposal")
    if (proposal) sections.push(documentSection(proposal))
  }

  if (opts.instructions?.trim()) {
    sections.push(
      `## Additional instructions from Jamie\n\n${opts.instructions.trim()}`
    )
  }

  sections.push(
    `# Task\n\nProduce the ${spec.title.toLowerCase()} for this deal now, following the output rules.`
  )

  return {
    deal,
    client,
    kind,
    model: modelFor(kind),
    system: stage.system,
    prompt: sections.join("\n\n"),
    // Record the client repo alongside the Layer-3 files when its snapshot went
    // into the context, so provenance shows exactly what grounded the run.
    contextFiles: repo
      ? [...stage.files, `github:${client.githubRepo}`]
      : stage.files,
    title: spec.title,
  }
}

/**
 * System prompt for the brainstorm chat — the web-connected sparring partner
 * a pitch is later drafted from. Loads the same Layer-4 material but no stage
 * spec: the brainstorm is a conversation, not a document run.
 */
export async function buildBrainstormContext(dealId: string): Promise<{
  system: string
  deal: Deal
}> {
  const deal = await getDeal(dealId)
  if (!deal) throw new Error("That deal no longer exists.")
  const client = await getClient(deal.clientId)
  if (!client) throw new Error("That deal's client no longer exists.")

  const pitch = await getLatestApprovedDocument(dealId, "pitch")
  const repo = await repoSection(client)

  const system = [
    `You are Jamie Nisbet's brainstorm partner. Jamie is a software engineer / AI consultant (standard rate €120/hour, ~30 hours/week capacity, trusted contractors on standby for larger builds). You are preparing his PITCH for one specific lead — the informal first meeting happens over a coffee or a drink, so the goal is a sharp, well-researched point of view on the lead's ask, not a slide deck.`,
    `You have a webResearch tool connected to the live web. USE IT — before proposing a direction, research the lead's market, existing/competing solutions, relevant tools and pricing, anything that changes the shape or the price of the build. Say what you found and cite where it came from.`,
    repo
      ? `The lead has a connected delivery repository (below). Ground your thinking in what actually exists there — its stack, structure, and current state — so effort bands and directions reflect the real codebase, not a greenfield guess.`
      : null,
    `Behave like a sharp colleague at a whiteboard: propose concrete solutions, name real trade-offs and risks, give rough effort bands in hours, and surface the questions that most change the design. Push back when an approach is over-built for the client's budget. Be concise — this is a chat, not a document.`,
    `When Jamie is happy with the direction he will hit "Draft pitch", which turns this thread into his meeting-prep pitch document — so keep the thread concrete enough to be drafted from.`,
    "",
    "# Working material",
    clientSection(client),
    dealSection(deal),
    repo,
    pitch ? documentSection(pitch) : null,
  ]
    .filter((s): s is string => s !== null)
    .join("\n\n")

  return { system, deal }
}
