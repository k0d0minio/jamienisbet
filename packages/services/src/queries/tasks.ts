import { and, asc, desc, isNotNull, isNull } from "drizzle-orm"
import { eq } from "drizzle-orm"

import { getDb } from "../client"
import { clients, tasks } from "../schema"

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

/** A todo carrying the name of the lead it hangs off, so a list of them reads
 * as "who is this about" without a second query per row. Null name = a todo
 * that belongs to no one in particular. */
export type TaskWithClient = Task & { clientName: string | null }

/** Open tasks, due-soonest first (undated ones last, newest-created first
 * among themselves). */
export async function listOpenTasks(): Promise<TaskWithClient[]> {
  const rows = await getDb()
    .select({ task: tasks, clientName: clients.name })
    .from(tasks)
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .where(isNull(tasks.completedAt))
    .orderBy(asc(tasks.dueDate), desc(tasks.createdAt))
  return rows.map((row) => ({ ...row.task, clientName: row.clientName }))
}

/** Recently completed tasks — the short done-trail under the open list. */
export async function listCompletedTasks(limit = 10): Promise<Task[]> {
  return getDb()
    .select()
    .from(tasks)
    .where(isNotNull(tasks.completedAt))
    .orderBy(desc(tasks.completedAt))
    .limit(limit)
}

export async function createTask(input: {
  title: string
  notes?: string | null
  clientId?: string | null
  dueDate?: Date | null
}): Promise<Task> {
  const [row] = await getDb()
    .insert(tasks)
    .values({
      title: input.title,
      notes: input.notes ?? null,
      clientId: input.clientId ?? null,
      dueDate: input.dueDate ?? null,
    })
    .returning()
  return row
}

/** Complete (or reopen) a task — soft flag, same idiom as archived_at. */
export async function setTaskCompleted(
  id: string,
  completed: boolean
): Promise<Task | undefined> {
  const [row] = await getDb()
    .update(tasks)
    .set({ completedAt: completed ? new Date() : null })
    .where(eq(tasks.id, id))
    .returning()
  return row
}

/** Move a todo onto a lead, or off every lead (null). The way a todo written
 * before anyone knew whose it was — "send the quote" — gets attached to the
 * person it turned out to be about. */
export async function setTaskClient(
  id: string,
  clientId: string | null
): Promise<Task | undefined> {
  const [row] = await getDb()
    .update(tasks)
    .set({ clientId })
    .where(eq(tasks.id, id))
    .returning()
  return row
}

export async function deleteTask(id: string): Promise<void> {
  await getDb().delete(tasks).where(eq(tasks.id, id))
}

/** Open tasks for one client — surfaced on the client profile. */
export async function listOpenTasksForClient(clientId: string): Promise<Task[]> {
  return getDb()
    .select()
    .from(tasks)
    .where(and(isNull(tasks.completedAt), eq(tasks.clientId, clientId)))
    .orderBy(asc(tasks.dueDate), desc(tasks.createdAt))
}
