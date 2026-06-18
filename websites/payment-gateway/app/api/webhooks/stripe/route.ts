import type Stripe from "stripe"

import { getStripe } from "@/lib/stripe"

// Stripe webhook receiver. Verifies the signature against the raw body, then
// reconciles a completed Checkout Session back to its source invoice.
//
// Signature verification needs the *raw* request body, so we read req.text()
// (never req.json()). Node runtime — constructEvent is synchronous here.
export const runtime = "nodejs"

export async function POST(req: Request): Promise<Response> {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) {
    return new Response("Stripe not configured", { status: 503 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    })
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session
      const invoiceId = session.metadata?.invoice_id
      if (invoiceId) {
        try {
          // The funds were captured by the Checkout PaymentIntent; mark the
          // source Stripe invoice paid (out of band) so the books match.
          await stripe.invoices.pay(invoiceId, { paid_out_of_band: true })
        } catch (err) {
          // Already paid / not payable — log and move on; the charge still stands.
          console.warn(`[stripe-webhook] could not mark invoice ${invoiceId} paid:`, err)
        }
      }

      // ----------------------------------------------------------------------
      // TODO(send-later): write the payment back into the business ledgers.
      //
      // Per the repo rule "no outbound action without review", the repo-side
      // write is intentionally deferred. When ready, record it here:
      //   - workspaces/finance/ — income + tax-reserve recalculation
      //   - shared/clients/<slug>/finances.md — invoice status -> `paid`
      //   - affiliate 10% payout accrual where a referral code is attached
      // Stripe remains the source of truth; this only mirrors it into the repo.
      // ----------------------------------------------------------------------
      console.info("[stripe-webhook] payment completed", {
        invoiceId,
        sessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
      })
      break
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session
      console.warn("[stripe-webhook] async payment failed", {
        invoiceId: session.metadata?.invoice_id,
        sessionId: session.id,
      })
      break
    }

    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
