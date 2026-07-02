"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  clearWorkshop,
  createDeal,
  dealStatuses,
  deleteDeal,
  deleteDocument,
  getClient,
  getDeal,
  getDocument,
  getLatestApprovedDocument,
  recordDocumentSync,
  setDocumentStatus,
  updateDeal,
  updateDocumentContent,
  type DealStatus,
} from "@jamie-nisbet/services"

import { ensureStripeCustomer } from "@/lib/clients-stripe"
import { parseAmountToMinor } from "@/lib/money"
import { syncDocumentToRepo } from "@/lib/repo-sync"
import { getStripe } from "@/lib/stripe"

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
 *
 * Approval also triggers the repo sync-back: the now-reviewed artifact is
 * committed into the ICM folders so the repo stays the canonical record.
 * Sync is best-effort — a GitHub hiccup never un-approves a document; the
 * document page shows whether it synced.
 */
export async function approveDocumentAction(id: string) {
  const doc = await setDocumentStatus(id, "approved")
  if (!doc) throw new Error("That document no longer exists.")

  try {
    const deal = await getDeal(doc.dealId)
    const client = deal ? await getClient(deal.clientId) : undefined
    if (client) {
      const path = await syncDocumentToRepo(doc, client.name)
      if (path) await recordDocumentSync(doc.id, path)
    }
  } catch (err) {
    console.error("repo sync-back failed", err)
  }

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

// ---- Billing hand-off --------------------------------------------------------

/**
 * Approved quote → Stripe DRAFT invoice for the deal's value, on the existing
 * billing rails (same shape as the Invoices surface: drafts are never emailed;
 * "Finalize & send" stays a deliberate second step over there). The approved
 * quote is the review gate that authorises raising the figure at all.
 */
export async function createDraftInvoiceFromQuoteAction(dealId: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured in this environment.")

  const deal = await getDeal(dealId)
  if (!deal) throw new Error("That deal no longer exists.")

  const quote = await getLatestApprovedDocument(dealId, "quote")
  if (!quote) {
    throw new Error("The quote must be approved before an invoice is raised.")
  }
  if (deal.valueMinor <= 0) {
    throw new Error(
      "Set the deal value first — it becomes the invoice amount (the number you confirmed on the quote)."
    )
  }

  const client = await getClient(deal.clientId)
  if (!client) throw new Error("That deal's client no longer exists.")
  if (!client.email) {
    throw new Error(`${client.name} has no email — add one on their profile first.`)
  }

  const description = `${deal.title} — per approved quote v${quote.version}`.slice(0, 500)
  const customer = await ensureStripeCustomer(stripe, client)
  const invoice = await stripe.invoices.create({
    customer,
    collection_method: "send_invoice",
    days_until_due: 14,
    description,
    auto_advance: false, // stay a draft until explicitly sent from Invoices
  })
  await stripe.invoiceItems.create({
    customer,
    invoice: invoice.id,
    amount: deal.valueMinor,
    currency: "eur",
    description,
  })

  revalidatePath("/invoices")
  revalidatePath("/finances")
  revalidateDeal(deal.id, deal.clientId)
}
