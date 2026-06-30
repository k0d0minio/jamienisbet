"use server"

import { getInvoice } from "@/lib/invoice"
import { getStripe, siteOrigin } from "@/lib/stripe"
import { routing, type Locale } from "@/i18n/routing"

// Create an embedded Checkout Session for an existing invoice and return its
// client_secret. The amount is re-resolved server-side from the invoice (the
// trusted source) — nothing about the price comes from the browser.
//
// We mirror the invoice's amount/currency into a one-line Checkout Session and
// tag it with metadata.invoice_id. The webhook reconciles back to the Stripe
// invoice on completion (marks it paid). This is the standard way to collect an
// invoice through Embedded Checkout while keeping the form on-brand and on-site.
//
// `locale` is the active app locale: it sets Stripe's hosted form language (our
// codes en/pt/fr happen to be valid Stripe Checkout locales) and prefixes the
// return URL so the status page stays in the same language.
export async function createCheckoutSession(
  invoiceId: string,
  locale: Locale = routing.defaultLocale,
): Promise<string> {
  const stripe = getStripe()
  if (!stripe) {
    // No live keys — the embedded component never calls this (it shows the
    // demo-mode notice instead). Guard anyway so the contract is explicit.
    throw new Error("Payments are not configured in this environment.")
  }

  const invoice = await getInvoice(invoiceId)
  if (!invoice) throw new Error("Invoice not found.")
  if (!invoice.isPayable) throw new Error("This invoice is not open for payment.")

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: invoice.currency,
          unit_amount: invoice.amountDue, // trusted: from the invoice, not the client
          product_data: {
            name: `Invoice ${invoice.number}`,
            description: invoice.lines.map((l) => l.description).join(" · ").slice(0, 280),
          },
        },
      },
    ],
    customer_email: invoice.customerEmail ?? undefined,
    // Carried through to the webhook so it can mark the right invoice paid.
    // Match Stripe's hosted UI language to the page. Our locale codes (en/pt/fr)
    // are all valid Stripe Checkout locales, so this passes through directly.
    locale,
    metadata: { invoice_id: invoice.id },
    payment_intent_data: { metadata: { invoice_id: invoice.id } },
    return_url: `${siteOrigin()}/${locale}/pay/${invoice.id}/return?session_id={CHECKOUT_SESSION_ID}`,
  })

  if (!session.client_secret) {
    throw new Error("Stripe did not return a client secret.")
  }
  return session.client_secret
}
