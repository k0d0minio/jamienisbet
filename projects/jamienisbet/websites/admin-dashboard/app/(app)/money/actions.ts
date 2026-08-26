"use server"

import { revalidatePath } from "next/cache"

import { getClient } from "@jamie-nisbet/services"

import { ensureStripeCustomer } from "@/lib/clients-stripe"
import { parseAmountToMinor } from "@/lib/money"
import { getStripe } from "@/lib/stripe"

// Everything money-related is one screen, so every mutation refreshes it. The
// leads list is refreshed too — raising an invoice links a Stripe customer onto
// the lead row.
function revalidateMoney() {
  revalidatePath("/money")
  revalidatePath("/")
}

// ---- Invoices ----------------------------------------------------------------

export type InvoiceFormState = { error?: string; success?: string }

/**
 * Create a *draft* invoice for a chosen lead. The lead is picked from the ones
 * in the database rather than typed in, so every invoice is addressed to a real
 * record: ensureStripeCustomer resolves (and links) that lead's Stripe customer
 * before the invoice is raised.
 *
 * Drafts are never emailed — sending is a deliberate second step ("Finalize &
 * send"), which keeps a review gate between raising a figure and putting it in
 * front of a client (the repo's "no outbound action without review" boundary).
 */
export async function createInvoice(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const stripe = getStripe()
  if (!stripe) return { error: "Stripe is not configured in this environment." }

  const clientId = String(formData.get("clientId") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const currency = String(formData.get("currency") ?? "eur").trim().toLowerCase()
  const daysUntilDue = Number(formData.get("daysUntilDue") ?? 14)
  const amount = parseAmountToMinor(String(formData.get("amount") ?? ""))

  if (!clientId) return { error: "Choose someone to invoice." }
  if (!description) return { error: "A line-item description is required." }
  if (amount === null) return { error: "Enter a valid amount greater than zero." }
  if (!Number.isFinite(daysUntilDue) || daysUntilDue < 0) {
    return { error: "Days until due must be zero or more." }
  }

  const client = await getClient(clientId)
  if (!client) return { error: "That lead no longer exists." }
  // send_invoice needs somewhere to send it; someone with no email can't be
  // invoiced until one is added on their profile.
  if (!client.email) {
    return { error: `${client.name} has no email — add one on their profile first.` }
  }

  try {
    const customer = await ensureStripeCustomer(stripe, client)

    // Create the draft invoice first, then attach the line item to it directly
    // (avoids pending-invoice-item ambiguity across API versions).
    const invoice = await stripe.invoices.create({
      customer,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      description: description.slice(0, 500),
      auto_advance: false, // stay a draft until explicitly sent
    })

    await stripe.invoiceItems.create({
      customer,
      invoice: invoice.id,
      amount,
      currency,
      description: description.slice(0, 500),
    })

    revalidateMoney()
    return {
      success: `Draft invoice created for ${client.name} (${client.email}). Review it, then send.`,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create the invoice." }
  }
}

/** Finalize a draft and email the hosted invoice to the customer. */
export async function sendInvoice(id: string): Promise<void> {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured.")
  // sendInvoice finalizes a draft if needed and emails the hosted link.
  await stripe.invoices.sendInvoice(id)
  revalidateMoney()
}

/**
 * Cancel an invoice: delete it if it's still a draft, otherwise void the
 * finalized invoice (which cannot be deleted). The caller passes the current
 * status so we pick the right operation.
 */
export async function cancelInvoice(id: string, isDraft: boolean): Promise<void> {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured.")
  if (isDraft) {
    await stripe.invoices.del(id)
  } else {
    await stripe.invoices.voidInvoice(id)
  }
  revalidateMoney()
}

// ---- Payment links -----------------------------------------------------------

export type PaymentLinkFormState = { error?: string; success?: string; url?: string }

/**
 * Create a reusable payment link for an inline-priced product. A Price object is
 * required to back a payment link, so we mint an inline Price (with its product)
 * from the entered amount, then attach it. Unlike an invoice, a link is not
 * addressed to anyone and sends no email — it is safe to create directly and is
 * only shared once the owner copies it.
 */
export async function createPaymentLink(
  _prev: PaymentLinkFormState,
  formData: FormData
): Promise<PaymentLinkFormState> {
  const stripe = getStripe()
  if (!stripe) return { error: "Stripe is not configured in this environment." }

  const name = String(formData.get("name") ?? "").trim()
  const currency = String(formData.get("currency") ?? "eur").trim().toLowerCase()
  const amount = parseAmountToMinor(String(formData.get("amount") ?? ""))

  if (!name) return { error: "A product name is required." }
  if (amount === null) return { error: "Enter a valid amount greater than zero." }

  try {
    const price = await stripe.prices.create({
      currency,
      unit_amount: amount,
      product_data: { name: name.slice(0, 250) },
    })

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
    })

    revalidateMoney()
    return { success: "Payment link created.", url: link.url }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create the payment link.",
    }
  }
}

/** Deactivate a link so it stops accepting payments (links can't be deleted). */
export async function deactivatePaymentLink(id: string): Promise<void> {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured.")
  await stripe.paymentLinks.update(id, { active: false })
  revalidateMoney()
}
