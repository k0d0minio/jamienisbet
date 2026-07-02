"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  clearWorkshop,
  createDeal,
  dealStatuses,
  deleteDeal,
  deleteDocument,
  getDeal,
  getDocument,
  setDocumentStatus,
  updateDeal,
  updateDocumentContent,
  type DealStatus,
} from "@jamie-nisbet/services"

import { parseAmountToMinor } from "@/lib/money"

// A deal edit touches its own page, the client it belongs to, and the
// dashboard's pipeline counters.
function revalidateDeal(dealId: string, clientId?: string | null) {
  revalidatePath(`/deals/${dealId}`)
  if (clientId) revalidatePath(`/clients/${clientId}`)
  revalidatePath("/")
}

export async function createDealAction(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  if (!title) throw new Error("A deal needs a title.")

  const valueRaw = String(formData.get("value") ?? "").trim()
  const valueMinor = valueRaw === "" ? 0 : parseAmountToMinor(valueRaw)
  if (valueMinor === null) {
    throw new Error("Enter a valid value in EUR, or leave it empty.")
  }

  const deal = await createDeal({ clientId, title, valueMinor })
  revalidateDeal(deal.id, clientId)
  redirect(`/deals/${deal.id}`)
}

export async function updateDealStatusAction(id: string, status: string) {
  if (!(dealStatuses as readonly string[]).includes(status)) {
    throw new Error(`Unknown deal status: ${status}`)
  }
  const deal = await updateDeal(id, { status: status as DealStatus })
  if (deal) revalidateDeal(deal.id, deal.clientId)
}

export async function updateDealDetailsAction(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  const valueRaw = String(formData.get("value") ?? "").trim()
  const valueMinor = valueRaw === "" ? 0 : parseAmountToMinor(valueRaw)
  if (valueMinor === null) {
    throw new Error("Enter a valid value in EUR, or leave it empty.")
  }
  const deal = await updateDeal(id, {
    ...(title ? { title } : {}),
    valueMinor,
  })
  if (deal) revalidateDeal(deal.id, deal.clientId)
}

export async function removeDealAction(id: string) {
  const deal = await getDeal(id)
  await deleteDeal(id)
  revalidatePath("/")
  if (deal) revalidatePath(`/clients/${deal.clientId}`)
  redirect(deal ? `/clients/${deal.clientId}` : "/clients")
}

// ---- Documents — the review surface ----------------------------------------

async function revalidateDocument(documentId: string): Promise<void> {
  const doc = await getDocument(documentId)
  if (!doc) return
  revalidatePath(`/deals/${doc.dealId}/documents/${documentId}`)
  const deal = await getDeal(doc.dealId)
  revalidateDeal(doc.dealId, deal?.clientId)
}

export async function saveDocumentAction(id: string, formData: FormData) {
  const doc = await getDocument(id)
  if (!doc) throw new Error("That document no longer exists.")

  const patch: { contentMd?: string; contentHtml?: string; title?: string } = {}
  const title = String(formData.get("title") ?? "").trim()
  if (title) patch.title = title
  // Mockups are HTML, everything else is markdown; edit whichever this
  // document carries.
  if (doc.contentHtml !== null) {
    patch.contentHtml = String(formData.get("content") ?? "")
  } else {
    patch.contentMd = String(formData.get("content") ?? "")
  }

  await updateDocumentContent(id, patch)
  await revalidateDocument(id)
}

/**
 * The review gate. Approval is the explicit human sign-off the ICM stage
 * contracts require — only from here can a document feed anything downstream
 * (dependent generators, the draft invoice, export, repo sync-back).
 */
export async function approveDocumentAction(id: string) {
  const doc = await setDocumentStatus(id, "approved")
  if (!doc) throw new Error("That document no longer exists.")
  await revalidateDocument(id)
}

export async function rejectDocumentAction(id: string) {
  await setDocumentStatus(id, "rejected")
  await revalidateDocument(id)
}

/** Reopen a rejected/approved version for editing (back to draft). */
export async function reopenDocumentAction(id: string) {
  await setDocumentStatus(id, "draft")
  await revalidateDocument(id)
}

export async function removeDocumentAction(id: string) {
  const doc = await getDocument(id)
  if (!doc) return
  await deleteDocument(id)
  const deal = await getDeal(doc.dealId)
  revalidateDeal(doc.dealId, deal?.clientId)
  redirect(`/deals/${doc.dealId}`)
}

// ---- Workshop ---------------------------------------------------------------

export async function clearWorkshopAction(dealId: string) {
  await clearWorkshop(dealId)
  revalidatePath(`/deals/${dealId}`)
}
