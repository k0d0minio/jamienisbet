import "server-only"

import {
  getClient,
  getDeal,
  getLatestApprovedDocument,
  listWorkshopMessages,
  type Client,
  type Deal,
  type Document,
} from "@jamie-nisbet/services"
import {
  assembleStageContext,
  modelFor,
  stageSpecs,
  type DocumentKind,
} from "@jamie-nisbet/icm"

import { formatMoney } from "@/lib/money"
import { kindLabel } from "@/lib/kinds"

/**
 * Layer-4 assembly for one generation run: the client, the deal, and the prior
 * documents the stage builds on. The ICM review gates are enforced here, in
 * data terms — a stage that consumes an upstream document only ever sees an
 * APPROVED version of it. A missing approval throws GateError (surfaced as a
 * 409), which is the dashboard's version of "no document is generated until
 * this is signed off".
 */

export class GateError extends Error {}

// Upstream documents a kind REQUIRES an approved version of before it may run.
const HARD_GATES: Partial<Record<DocumentKind, DocumentKind[]>> = {
  // The customer translation of the triage decision — no decision, no page.
  customer_feedback: ["triage_assessment"],
  // The BRD is the customer-consumable form of the approved outline.
  brd: ["project_outline"],
  // Stage 03's CRITICAL gate: no proposal until the strategy is signed off.
  proposal: ["negotiation_strategy"],
  // Stage 05 prices the approved proposal's scope at the strategy's target.
  quote: ["negotiation_strategy", "proposal"],
}

// Upstream documents folded in when an approved version happens to exist.
const SOFT_CONTEXT: Partial<Record<DocumentKind, DocumentKind[]>> = {
  project_outline: ["triage_assessment"],
  negotiation_strategy: ["triage_assessment", "project_outline"],
  proposal: ["triage_assessment", "project_outline"],
  quote: ["project_outline"],
  mockup: ["project_outline", "proposal"],
}

// Kinds whose run also loads the persisted workshop transcript.
const WANTS_WORKSHOP: DocumentKind[] = ["project_outline", "mockup"]

function clientSection(client: Client): string {
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
  return [
    "## Deal",
    `- Title: ${deal.title}`,
    `- Status: ${deal.status}`,
    `- Working value: ${
      deal.valueMinor > 0 ? formatMoney(deal.valueMinor, "eur") : "not set yet"
    }`,
  ].join("\n")
}

function documentSection(doc: Document): string {
  return `## ${kindLabel(doc.kind)} (approved, v${doc.version})\n\n${
    doc.contentMd ?? doc.contentHtml ?? ""
  }`
}

export type GenerationRequest = {
  deal: Deal
  client: Client
  kind: DocumentKind
  model: string
  system: string
  prompt: string
  contractPath: string | null
  contextFiles: string[]
  isPrivate: boolean
  title: string
}

export async function buildGenerationRequest(
  kind: DocumentKind,
  dealId: string,
  instructions?: string
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

  for (const gateKind of HARD_GATES[kind] ?? []) {
    const doc = await getLatestApprovedDocument(dealId, gateKind)
    if (!doc) {
      throw new GateError(
        `${kindLabel(kind)} needs an approved ${kindLabel(
          gateKind
        )} first — that review gate is what unlocks this step.`
      )
    }
    sections.push(documentSection(doc))
  }

  for (const softKind of SOFT_CONTEXT[kind] ?? []) {
    const doc = await getLatestApprovedDocument(dealId, softKind)
    if (doc) sections.push(documentSection(doc))
  }

  if (WANTS_WORKSHOP.includes(kind)) {
    const messages = await listWorkshopMessages(dealId)
    if (messages.length > 0) {
      const transcript = messages
        .map((m) => `**${m.role === "user" ? "Jamie" : "Assistant"}:** ${m.content}`)
        .join("\n\n")
      sections.push(`## Technical workshop transcript\n\n${transcript}`)
    }
  }

  if (instructions?.trim()) {
    sections.push(`## Additional instructions from Jamie\n\n${instructions.trim()}`)
  }

  sections.push(
    `# Task\n\nProduce the ${spec.title.toLowerCase()} for this deal now, following the stage contract and output rules.`
  )

  return {
    deal,
    client,
    kind,
    model: modelFor(kind),
    system: stage.system,
    prompt: sections.join("\n\n"),
    contractPath: stage.contractPath,
    contextFiles: stage.files,
    isPrivate: spec.privateDoc,
    title: spec.title,
  }
}

/**
 * System prompt for the technical-workshop chat — the brainstorm surface an
 * outline is later crystallised from. Loads the same Layer-4 material but no
 * stage contract: the workshop is a conversation, not a document run.
 */
export async function buildWorkshopContext(dealId: string): Promise<{
  system: string
  deal: Deal
}> {
  const deal = await getDeal(dealId)
  if (!deal) throw new Error("That deal no longer exists.")
  const client = await getClient(deal.clientId)
  if (!client) throw new Error("That deal's client no longer exists.")

  const triage = await getLatestApprovedDocument(dealId, "triage_assessment")
  const outline = await getLatestApprovedDocument(dealId, "project_outline")

  const system = [
    `You are Jamie Nisbet's technical sparring partner. Jamie is a software engineer / AI consultant (standard rate €120/hour, ~30 hours/week capacity, trusted contractors on standby for larger builds). You are brainstorming HOW to implement one specific client project, in private — the client never sees this conversation.`,
    `Behave like a sharp colleague at a whiteboard: propose concrete architectures and integrations, name real trade-offs and risks, give rough effort bands in hours, and ask the questions that most change the design ("ask as many questions as possible" is the founder's explicit instruction). Push back when an approach is over-built for the client's budget. Be concise — this is a chat, not a document.`,
    `When Jamie is happy with a direction he will hit "Crystallise", which turns this transcript into a project outline document — so keep the thread concrete enough to be crystallised.`,
    "",
    "# Working material",
    clientSection(client),
    dealSection(deal),
    triage ? documentSection(triage) : null,
    outline ? documentSection(outline) : null,
  ]
    .filter((s): s is string => s !== null)
    .join("\n\n")

  return { system, deal }
}
