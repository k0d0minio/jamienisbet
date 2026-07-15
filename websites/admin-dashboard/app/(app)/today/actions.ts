"use server"

import { revalidatePath } from "next/cache"

import {
  completeComplianceDate,
  createComplianceDate,
  createTask,
  deleteComplianceDate,
  deleteTask,
  isComplianceRecurrence,
  setTaskCompleted,
} from "@jamie-nisbet/services"

// Everything on /today is live business state; a change re-reads the page.
function revalidateToday() {
  revalidatePath("/today")
}

// ---- Tasks ------------------------------------------------------------------

export async function addTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  if (!title) throw new Error("A task needs a title.")

  const dueRaw = String(formData.get("dueDate") ?? "").trim()
  let dueDate: Date | null = null
  if (dueRaw !== "") {
    const parsed = new Date(dueRaw)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Enter a valid due date, or leave it empty.")
    }
    dueDate = parsed
  }

  await createTask({ title, dueDate })
  revalidateToday()
}

export async function setTaskCompletedAction(id: string, completed: boolean) {
  await setTaskCompleted(id, completed)
  revalidateToday()
}

export async function deleteTaskAction(id: string) {
  await deleteTask(id)
  revalidateToday()
}

// ---- Compliance calendar ------------------------------------------------------

export async function addComplianceDateAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  if (!title) throw new Error("An obligation needs a title.")

  const dueRaw = String(formData.get("dueDate") ?? "").trim()
  const dueDate = new Date(dueRaw)
  if (dueRaw === "" || Number.isNaN(dueDate.getTime())) {
    throw new Error("A compliance obligation needs a valid due date.")
  }

  const recurrenceRaw = String(formData.get("recurrence") ?? "none")
  const recurrence = isComplianceRecurrence(recurrenceRaw)
    ? recurrenceRaw
    : "none"

  // Per the legal/tax standing rule, notes should carry source + as-of date;
  // decision-support only either way.
  const notes = String(formData.get("notes") ?? "").trim() || null

  await createComplianceDate({ title, notes, dueDate, recurrence })
  revalidateToday()
}

/** Completing a recurring obligation re-arms the next occurrence (handled in
 * the query layer). */
export async function completeComplianceDateAction(id: string) {
  await completeComplianceDate(id)
  revalidateToday()
}

export async function deleteComplianceDateAction(id: string) {
  await deleteComplianceDate(id)
  revalidateToday()
}
