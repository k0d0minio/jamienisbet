"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  billingTypes,
  clearWorkshop,
  createDeal,
  dealStatuses,
  deleteDeal,
  deleteDocument,
  getClient,
  getDeal,
  getDocument,
  getLatestApprovedDocument,
  isOnboardingStepKey,
  linkMilestoneInvoice,
  parsePaymentSchedule,
  setClientRepo,
  setDocumentStatus,
  setOnboardingStep,
  updateDeal,
  updateDocumentContent,
  type DealStatus,
} from "@jamie-nisbet/services"
import { loadDeliveryTemplates } from "@jamie-nisbet/icm"

import { ensureStripeCustomer } from "@/lib/clients-stripe"
import {
  clientSlug,
  createRepo,
  isGithubConfigured,
  seedRepoFiles,
} from "@/lib/github"
import { parseAmountToMinor } from "@/lib/money"
import { getStripe } from "@/lib/stripe"

import type { BillingType } from "@jamie-nisbet/services"

// Read the billing fields shared by the create and edit forms: how the deal is
// billed, and — for a retainer — its monthly amount and optional end date. The
// recurring figure is only meaningful for a retainer; a one-off keeps it 0.
function readBillingFields(formData: FormData): {
  billingType: BillingType
  recurringAmountMinor: number
  activeUntil: Date | null
} {
  const raw = String(formData.get("billingType") ?? "one_off")
  const billingType = (billingTypes as readonly string[]).includes(raw)
    ? (raw as BillingType)
    : "one_off"

  let recurringAmountMinor = 0
  if (billingType === "retainer") {
    const recurringRaw = String(formData.get("recurringAmount") ?? "").trim()
    const parsed = recurringRaw === "" ? 0 : parseAmountToMinor(recurringRaw)
    if (parsed === null) {
      throw new Error("Enter a valid monthly amount in EUR, or leave it empty.")
    }
    recurringAmountMinor = parsed
  }

  const untilRaw = String(formData.get("activeUntil") ?? "").trim()
  let activeUntil: Date | null = null
  if (billingType === "retainer" && untilRaw !== "") {
    const parsed = new Date(untilRaw)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Enter a valid end date, or leave it empty for open-ended.")
    }
    activeUntil = parsed
  }

  return { billingType, recurringAmountMinor, activeUntil }
}

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

  const { billingType, recurringAmountMinor, activeUntil } =
    readBillingFields(formData)

  const deal = await createDeal({
    clientId,
    title,
    valueMinor,
    billingType,
    recurringAmountMinor,
    activeUntil,
  })
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

  const { billingType, recurringAmountMinor, activeUntil } =
    readBillingFields(formData)

  const deal = await updateDeal(id, {
    ...(title ? { title } : {}),
    valueMinor,
    billingType,
    recurringAmountMinor,
    activeUntil,
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

// ---- Won-deal onboarding ----------------------------------------------------
// The checklist stores only what can't be derived (see lib/onboarding.ts).
// Every step is a human click — winning a deal fires nothing on its own.

export async function markOnboardingStepAction(
  dealId: string,
  step: string,
  done: boolean
) {
  if (!isOnboardingStepKey(step)) {
    throw new Error(`Unknown onboarding step: ${step}`)
  }
  const deal = await setOnboardingStep(dealId, step, done ? new Date() : null)
  if (deal) revalidateDeal(deal.id, deal.clientId)
}

/**
 * Create the client's delivery repo if they don't have one yet, then commit
 * the delivery-stage docs (shared/templates/delivery/ → docs/icm/) into it.
 * Idempotent: files that already exist are left untouched; re-running after a
 * partial failure fills the gaps. Returns a human-readable summary.
 */
export async function seedDeliveryRepoAction(
  dealId: string
): Promise<{ ok: boolean; message: string }> {
  if (!isGithubConfigured()) {
    return {
      ok: false,
      message: "GitHub is not configured in this environment (GITHUB_TOKEN).",
    }
  }
  const deal = await getDeal(dealId)
  if (!deal) throw new Error("That deal no longer exists.")
  const client = await getClient(deal.clientId)
  if (!client) throw new Error("That client no longer exists.")

  let repoFullName = client.githubRepo
  let created = false
  if (!repoFullName) {
    const repo = await createRepo({
      name: clientSlug(client.name),
      description: `Delivery repo for ${client.name} — ${deal.title}`,
      private: true,
    })
    await setClientRepo(client.id, {
      githubRepo: repo.fullName,
      githubDefaultBranch: repo.defaultBranch,
    })
    repoFullName = repo.fullName
    created = true
  }

  const results = await seedRepoFiles(repoFullName, loadDeliveryTemplates())
  const failed = results.filter((r) => r.outcome === "failed")

  if (failed.length === 0) {
    await setOnboardingStep(dealId, "repoSeededAt", new Date())
  }
  revalidateDeal(dealId, deal.clientId)

  const seeded = results.filter((r) => r.outcome === "created").length
  const existing = results.filter((r) => r.outcome === "exists").length
  const parts = [
    created ? `Created ${repoFullName}.` : `Using ${repoFullName}.`,
    seeded > 0 ? `Committed ${seeded} doc${seeded === 1 ? "" : "s"}.` : null,
    existing > 0 ? `${existing} already existed (left untouched).` : null,
    failed.length > 0
      ? `FAILED: ${failed.map((f) => `${f.path} (${f.error})`).join("; ")}`
      : null,
  ].filter(Boolean)

  return { ok: failed.length === 0, message: parts.join(" ") }
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
 * (dependent generators, the draft invoice, export). Approval flips
 * `documents.status` in the DB and nothing else: the database is the sole
 * store, so there is no write back to git.
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

// ---- Brainstorm ---------------------------------------------------------------

export async function clearBrainstormAction(dealId: string) {
  await clearWorkshop(dealId)
  revalidatePath(`/deals/${dealId}`)
}

// ---- Step 3: get paid ----------------------------------------------------------

/**
 * One payment milestone from the approved proposal → one Stripe DRAFT invoice,
 * on the existing billing rails (same shape as the Invoices surface: drafts
 * are never emailed; "Finalize & send" stays a deliberate second step over
 * there). The approved proposal is the review gate that authorises raising
 * the figure at all — its stored payment schedule is exactly what gets
 * invoiced, so the document and the billing can never drift.
 */
export async function createMilestoneInvoiceAction(
  dealId: string,
  milestoneId: string
) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured in this environment.")

  const deal = await getDeal(dealId)
  if (!deal) throw new Error("That deal no longer exists.")

  const proposal = await getLatestApprovedDocument(dealId, "proposal")
  if (!proposal) {
    throw new Error("The proposal must be approved before an invoice is raised.")
  }

  const milestone = parsePaymentSchedule(deal).find((m) => m.id === milestoneId)
  if (!milestone) throw new Error("That payment milestone no longer exists.")
  if (milestone.stripeInvoiceId) {
    throw new Error("This milestone already has an invoice — see Invoices.")
  }
  if (milestone.amountMinor <= 0) {
    throw new Error("This milestone has no amount to invoice.")
  }

  const client = await getClient(deal.clientId)
  if (!client) throw new Error("That deal's client no longer exists.")
  if (!client.email) {
    throw new Error(`${client.name} has no email — add one on their profile first.`)
  }

  const description =
    `${deal.title} — ${milestone.label} (per approved proposal v${proposal.version})`.slice(0, 500)
  const customer = await ensureStripeCustomer(stripe, client)
  const invoice = await stripe.invoices.create({
    customer,
    collection_method: "send_invoice",
    days_until_due: 14,
    description,
    auto_advance: false, // stay a draft until explicitly sent from Invoices
  })
  if (!invoice.id) throw new Error("Stripe returned an invoice without an id.")
  await stripe.invoiceItems.create({
    customer,
    invoice: invoice.id,
    amount: milestone.amountMinor,
    currency: "eur",
    description,
  })

  await linkMilestoneInvoice(dealId, milestoneId, invoice.id)

  revalidatePath("/invoices")
  revalidatePath("/finances")
  revalidateDeal(deal.id, deal.clientId)
}
