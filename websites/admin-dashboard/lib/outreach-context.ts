import "server-only"

import {
  getClient,
  listDealsForClient,
  listTouchesForClient,
  type Client,
  type Touch,
} from "@jamie-nisbet/services"
import {
  assembleOutreachContext,
  modelForTier,
  outreachSpecs,
  type TouchKind,
} from "@jamie-nisbet/icm"

import { clientSection } from "@/lib/deal-context"
import { formatMoney } from "@/lib/money"

// Layer-4 assembly for an outreach draft — the client relationship as it
// stands: who they are, the open deals in play, and the touch history so a
// follow-up references where the conversation actually left off. Mirrors
// lib/deal-context.ts for the deal pipeline.

function dealsLine(deals: Awaited<ReturnType<typeof listDealsForClient>>): string | null {
  const open = deals.filter((d) => !["won", "lost"].includes(d.status))
  if (open.length === 0) return null
  const lines = open.map((d) => {
    const value =
      d.billingType === "retainer"
        ? d.recurringAmountMinor > 0
          ? `${formatMoney(d.recurringAmountMinor, "eur")}/mo retainer`
          : "retainer"
        : d.valueMinor > 0
          ? formatMoney(d.valueMinor, "eur")
          : "value unset"
    return `- ${d.title} (${d.status}, ${value})`
  })
  return `## Open deals\n${lines.join("\n")}`
}

function touchHistorySection(touches: Touch[]): string | null {
  const logged = touches.filter((t) => t.loggedAt !== null).slice(0, 5)
  if (logged.length === 0) return null
  const lines = logged.map(
    (t) =>
      `- ${t.loggedAt!.toISOString().slice(0, 10)} — ${t.kind} via ${
        t.channel ?? "unknown"
      }`
  )
  return `## Recent touches (sent)\n${lines.join("\n")}`
}

export type OutreachRequest = {
  client: Client
  model: string
  system: string
  prompt: string
  contextFiles: string[]
}

export async function buildOutreachRequest(
  kind: TouchKind,
  clientId: string,
  opts: { guidance?: string } = {}
): Promise<OutreachRequest> {
  const client = await getClient(clientId)
  if (!client) throw new Error("That client no longer exists.")

  const [deals, touches] = await Promise.all([
    listDealsForClient(clientId),
    listTouchesForClient(clientId),
  ])

  const stage = assembleOutreachContext(kind)

  const sections = [
    "# Working material (Layer 4)",
    clientSection(client),
    dealsLine(deals),
    touchHistorySection(touches),
    opts.guidance?.trim()
      ? `## Guidance from Jamie for this draft\n\n${opts.guidance.trim()}`
      : null,
    `# Task\n\nDraft the ${outreachSpecs[kind].title.toLowerCase()} for this client now, following the output rules.`,
  ].filter((s): s is string => s !== null)

  return {
    client,
    model: modelForTier(outreachSpecs[kind].modelTier),
    system: stage.system,
    prompt: sections.join("\n\n"),
    contextFiles: stage.files,
  }
}
