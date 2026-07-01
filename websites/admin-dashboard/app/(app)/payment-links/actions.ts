"use server"

import { revalidatePath } from "next/cache"

import { parseAmountToMinor } from "@/lib/money"
import { getStripe } from "@/lib/stripe"

export type PaymentLinkFormState = { error?: string; success?: string; url?: string }

function revalidateLinks() {
  revalidatePath("/payment-links")
  revalidatePath("/")
}

/**
 * Create a reusable payment link for an inline-priced product. A Price object is
 * required to back a payment link, so we mint an inline Price (with its product)
 * from the entered amount, then attach it. Unlike an invoice, a link is not
 * addressed to a client and sends no email — it is safe to create directly and
 * is only shared once the owner copies it.
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

    revalidateLinks()
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
  revalidateLinks()
}
