import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { getDb } from "../client"
import { documents } from "../schema"

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert

// The review-gate lifecycle. `approved` is the only state anything downstream
// (invoice, export, dependent generators) may consume.
export const documentStatuses = [
  "draft",
  "in_review",
  "approved",
  "rejected",
] as const
export type DocumentStatus = (typeof documentStatuses)[number]

/**
 * Insert the next version of a (deal, kind) document. Versions are computed
 * here so regeneration can never overwrite a prior draft or an approved
 * artifact — the trail is the review surface.
 */
export async function createDocument(input: {
  dealId: string
  kind: string
  title: string
  contentMd?: string | null
  contentHtml?: string | null
  isPrivate?: boolean
}): Promise<Document> {
  const db = getDb()
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${documents.version}), 0)` })
    .from(documents)
    .where(
      and(eq(documents.dealId, input.dealId), eq(documents.kind, input.kind))
    )
  const [row] = await db
    .insert(documents)
    .values({
      dealId: input.dealId,
      kind: input.kind,
      title: input.title,
      contentMd: input.contentMd ?? null,
      contentHtml: input.contentHtml ?? null,
      isPrivate: input.isPrivate ?? false,
      version: Number(max) + 1,
    })
    .returning()
  return row
}

export async function listDocumentsForDeal(dealId: string): Promise<Document[]> {
  return getDb()
    .select()
    .from(documents)
    .where(eq(documents.dealId, dealId))
    .orderBy(desc(documents.createdAt))
}

export async function getDocument(id: string): Promise<Document | undefined> {
  const [row] = await getDb()
    .select()
    .from(documents)
    .where(eq(documents.id, id))
  return row
}

/** The newest approved version of a (deal, kind) — what downstream stages are
 * allowed to build on. Undefined when nothing is approved yet. */
export async function getLatestApprovedDocument(
  dealId: string,
  kind: string
): Promise<Document | undefined> {
  const [row] = await getDb()
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.dealId, dealId),
        eq(documents.kind, kind),
        eq(documents.status, "approved")
      )
    )
    .orderBy(desc(documents.version))
    .limit(1)
  return row
}

/** Edit a document's content. Only drafts / in-review documents are editable —
 * an approved artifact is the reviewed record and must not drift from what was
 * approved (regenerate or start a new version instead). */
export async function updateDocumentContent(
  id: string,
  patch: { contentMd?: string | null; contentHtml?: string | null; title?: string }
): Promise<Document | undefined> {
  const db = getDb()
  const [existing] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
  if (!existing) return undefined
  if (existing.status === "approved") {
    throw new Error(
      "This version is approved and locked. Generate a new version to change it."
    )
  }
  const [row] = await db
    .update(documents)
    .set({ ...patch, status: "draft", updatedAt: new Date() })
    .where(eq(documents.id, id))
    .returning()
  return row
}

export async function setDocumentStatus(
  id: string,
  status: DocumentStatus
): Promise<Document | undefined> {
  const [row] = await getDb()
    .update(documents)
    .set({
      status,
      approvedAt: status === "approved" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning()
  return row
}

export async function deleteDocument(id: string): Promise<void> {
  await getDb().delete(documents).where(eq(documents.id, id))
}

/** How many documents sit before the review gate — the dashboard's "waiting
 * on you" counter. */
export async function countDocumentsAwaitingReview(): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(documents)
    .where(inArray(documents.status, ["draft", "in_review"]))
  return Number(row.count)
}
