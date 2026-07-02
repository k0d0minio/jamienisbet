"use server"

import { revalidatePath } from "next/cache"

import { parseAmountToMinor } from "@/lib/money"
import { getStripe } from "@/lib/stripe"

export type InvoiceFormState = { error?: string; success?: string }

function revalidateBilling() {
  revalidatePath("/invoices")
  revalidatePath("/finances")
  revalidatePath("/")
}

// Find an existing customer by email (so repeat invoices reuse one record) or
// create a new one. Email is the natural key Stripe dedupes on for invoicing.
async function resolveCustomerId(
  stripe: NonNullable<ReturnType<typeof getStripe>>,
  name: string,
  email: string
): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data[0]) return existing.data[0].id
  const created = await stripe.customers.create({ name: name || undefined, email })
  return created.id
}

/**
 * Create a *draft* invoice from the form. Drafts are never emailed — sending is
 * a deliberate second step ("Finalize & send"), which keeps a review gate
 * between raising a figure and putting it in front of a client (the repo's
 * "no outbound action without review" boundary).
 */
export async function createInvoice(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const stripe = getStripe()
  if (!stripe) return { error: "Stripe is not configured in this environment." }

  const name = String(formData.get("customerName") ?? "").trim()
  const email = String(formData.get("customerEmail") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const currency = String(formData.get("currency") ?? "eur").trim().toLowerCase()
  const daysUntilDue = Number(formData.get("daysUntilDue") ?? 14)
  const amount = parseAmountToMinor(String(formData.get("amount") ?? ""))

  if (!email) return { error: "A customer email is required." }
  if (!description) return { error: "A line-item description is required." }
  if (amount === null) return { error: "Enter a valid amount greater than zero." }
  if (!Number.isFinite(daysUntilDue) || daysUntilDue < 0) {
    return { error: "Days until due must be zero or more." }
  }

  try {
    const customer = await resolveCustomerId(stripe, name, email)

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

    revalidateBilling()
    return { success: `Draft invoice created for ${email}. Review it, then send.` }
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
  revalidateBilling()
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
  revalidateBilling()
}
