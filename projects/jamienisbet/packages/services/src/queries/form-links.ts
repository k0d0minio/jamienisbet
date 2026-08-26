import { and, desc, eq, isNull } from "drizzle-orm"

import { getDb } from "../client"
import { formLinks } from "../schema"
import type { FormAnswers, FormSnapshot } from "../forms"

export type FormLink = typeof formLinks.$inferSelect
export type NewFormLink = typeof formLinks.$inferInsert

// The link token comes straight off a public URL, so it reaches `getFormLink`
// as arbitrary text. Postgres rejects a malformed uuid with an error rather
// than an empty result, which would turn "someone mistyped a link" into a 500 —
// so the shape is checked here and a bad token is simply "no such form".
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isFormLinkToken(value: string): boolean {
  return UUID.test(value)
}

/**
 * Publish a questionnaire to one lead. The caller parses the markdown and hands
 * the result in — this layer never reads a file, it just freezes what it was
 * given. The returned row's `id` is the link token to hand to the customer.
 */
export async function createFormLink(input: {
  clientId: string
  formSlug: string
  formSnapshot: FormSnapshot
}): Promise<FormLink> {
  const [row] = await getDb()
    .insert(formLinks)
    .values({
      clientId: input.clientId,
      formSlug: input.formSlug,
      formSnapshot: input.formSnapshot,
    })
    .returning()
  return row
}

/** One link by its token. Undefined for an unknown *or* malformed token — the
 * public page renders the same dead-end for both. */
export async function getFormLink(id: string): Promise<FormLink | undefined> {
  if (!isFormLinkToken(id)) return undefined
  const [row] = await getDb().select().from(formLinks).where(eq(formLinks.id, id))
  return row
}

/** Every questionnaire sent to one lead, most recently sent first — the order
 * the profile's Forms card lists them in. */
export async function listFormLinksForClient(
  clientId: string
): Promise<FormLink[]> {
  return getDb()
    .select()
    .from(formLinks)
    .where(eq(formLinks.clientId, clientId))
    .orderBy(desc(formLinks.sentAt))
}

/**
 * Record a submission. Returns the completed row, or undefined if the link
 * doesn't exist or was already answered.
 *
 * The `completed_at is null` guard is in the WHERE clause rather than a read
 * followed by a write: that makes "submit exactly once" a property of the
 * update itself, so two submissions racing each other (a double-tapped button,
 * a retried request) can't both land — the second matches no row and comes back
 * undefined, which the page shows as the already-submitted dead-end.
 */
export async function saveFormLinkAnswers(
  id: string,
  answers: FormAnswers
): Promise<FormLink | undefined> {
  if (!isFormLinkToken(id)) return undefined
  const [row] = await getDb()
    .update(formLinks)
    .set({ answers, completedAt: new Date() })
    .where(and(eq(formLinks.id, id), isNull(formLinks.completedAt)))
    .returning()
  return row
}

/** Drop a link — a dead one sent to the wrong person, or a form nobody is going
 * to fill in. Permanent, and it takes any answers with it. */
export async function deleteFormLink(id: string): Promise<void> {
  if (!isFormLinkToken(id)) return
  await getDb().delete(formLinks).where(eq(formLinks.id, id))
}
