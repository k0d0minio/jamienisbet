import { desc, eq, sql } from "drizzle-orm"

import { getDb } from "../client"
import { generations } from "../schema"

export type Generation = typeof generations.$inferSelect
export type NewGeneration = typeof generations.$inferInsert

export async function recordGeneration(input: {
  /** The deal a run belonged to — omit for client-scoped runs (outreach). */
  dealId?: string | null
  /** The client a deal-less run belonged to. */
  clientId?: string | null
  documentId?: string | null
  kind: string
  model: string
  stageContractPath?: string | null
  contextFiles?: string[]
  inputTokens?: number | null
  outputTokens?: number | null
  latencyMs?: number | null
}): Promise<Generation> {
  const [row] = await getDb()
    .insert(generations)
    .values({
      dealId: input.dealId ?? null,
      clientId: input.clientId ?? null,
      documentId: input.documentId ?? null,
      kind: input.kind,
      model: input.model,
      stageContractPath: input.stageContractPath ?? null,
      contextFiles: input.contextFiles ? JSON.stringify(input.contextFiles) : null,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      latencyMs: input.latencyMs ?? null,
    })
    .returning()
  return row
}

export async function listGenerationsForDeal(
  dealId: string
): Promise<Generation[]> {
  return getDb()
    .select()
    .from(generations)
    .where(eq(generations.dealId, dealId))
    .orderBy(desc(generations.createdAt))
}

/** The provenance row for one document (a document has at most one — the run
 * that produced it). */
export async function getGenerationForDocument(
  documentId: string
): Promise<Generation | undefined> {
  const [row] = await getDb()
    .select()
    .from(generations)
    .where(eq(generations.documentId, documentId))
    .orderBy(desc(generations.createdAt))
    .limit(1)
  return row
}

export type GenerationTotals = {
  runs: number
  inputTokens: number
  outputTokens: number
}

/** Lifetime AI spend counters for the dashboard home. */
export async function getGenerationTotals(): Promise<GenerationTotals> {
  const [row] = await getDb()
    .select({
      runs: sql<number>`count(*)`,
      inputTokens: sql<number>`coalesce(sum(${generations.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${generations.outputTokens}), 0)`,
    })
    .from(generations)
  return {
    runs: Number(row.runs),
    inputTokens: Number(row.inputTokens),
    outputTokens: Number(row.outputTokens),
  }
}
