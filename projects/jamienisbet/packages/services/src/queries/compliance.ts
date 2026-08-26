import { asc, eq, isNull } from "drizzle-orm"

import { getDb } from "../client"
import { complianceDates } from "../schema"

export type ComplianceDate = typeof complianceDates.$inferSelect
export type NewComplianceDate = typeof complianceDates.$inferInsert

// How an obligation repeats. Completing a recurring row inserts the next
// occurrence as a fresh row (dueDate advanced by one period) — no calendar
// math at read time, and the done history stays queryable row by row.
export const complianceRecurrences = [
  "none",
  "monthly",
  "quarterly",
  "yearly",
] as const
export type ComplianceRecurrence = (typeof complianceRecurrences)[number]

export function isComplianceRecurrence(
  value: string
): value is ComplianceRecurrence {
  return (complianceRecurrences as readonly string[]).includes(value)
}

/** Open obligations, soonest due first. */
export async function listOpenComplianceDates(): Promise<ComplianceDate[]> {
  return getDb()
    .select()
    .from(complianceDates)
    .where(isNull(complianceDates.completedAt))
    .orderBy(asc(complianceDates.dueDate))
}

export async function createComplianceDate(input: {
  title: string
  notes?: string | null
  dueDate: Date
  recurrence?: ComplianceRecurrence
}): Promise<ComplianceDate> {
  const [row] = await getDb()
    .insert(complianceDates)
    .values({
      title: input.title,
      notes: input.notes ?? null,
      dueDate: input.dueDate,
      recurrence: input.recurrence ?? "none",
    })
    .returning()
  return row
}

/** The next due date after `from` for a recurrence — calendar-aware (adding a
 * month to Jan 31 clamps into late Feb/early Mar via JS Date semantics). */
export function nextOccurrence(from: Date, recurrence: ComplianceRecurrence): Date {
  const next = new Date(from)
  if (recurrence === "monthly") next.setMonth(next.getMonth() + 1)
  else if (recurrence === "quarterly") next.setMonth(next.getMonth() + 3)
  else if (recurrence === "yearly") next.setFullYear(next.getFullYear() + 1)
  return next
}

/**
 * Mark an obligation done. For a recurring one, insert the next occurrence
 * (same title/notes/recurrence, dueDate advanced one period) so the calendar
 * re-arms itself. Returns the completed row.
 */
export async function completeComplianceDate(
  id: string
): Promise<ComplianceDate | undefined> {
  const [row] = await getDb()
    .update(complianceDates)
    .set({ completedAt: new Date() })
    .where(eq(complianceDates.id, id))
    .returning()
  if (!row) return undefined

  if (isComplianceRecurrence(row.recurrence) && row.recurrence !== "none") {
    await getDb().insert(complianceDates).values({
      title: row.title,
      notes: row.notes,
      dueDate: nextOccurrence(row.dueDate, row.recurrence),
      recurrence: row.recurrence,
    })
  }
  return row
}

export async function deleteComplianceDate(id: string): Promise<void> {
  await getDb().delete(complianceDates).where(eq(complianceDates.id, id))
}
