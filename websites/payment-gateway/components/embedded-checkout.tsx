"use client"

import { useCallback } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js"
import { Alert, AlertDescription, AlertTitle } from "@jamie-nisbet/ui"
import { Info } from "lucide-react"

import { createCheckoutSession } from "@/app/actions/checkout"

// Load Stripe once, outside the component, to avoid recreating it on every
// render. When the publishable key is unset, there's no Stripe to load — the
// component renders a demo-mode notice instead of the form (keyless review path).
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export function Checkout({ invoiceId }: { invoiceId: string }) {
  // Bind the session to this invoice. The Embedded Checkout provider calls this
  // with no arguments, so we close over the id here.
  const fetchClientSecret = useCallback(
    () => createCheckoutSession(invoiceId),
    [invoiceId]
  )

  if (!stripePromise) {
    return (
      <Alert variant="info">
        <Info />
        <AlertTitle>Demo mode — payment is disabled</AlertTitle>
        <AlertDescription>
          This preview has no Stripe publishable key set, so the live card form
          isn&apos;t mounted. Add Stripe test keys to{" "}
          <code className="font-mono text-2xs">.env</code> to take a real test
          payment.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-1 shadow-sm">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
