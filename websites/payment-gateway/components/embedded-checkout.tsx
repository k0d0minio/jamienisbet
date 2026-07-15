"use client"

import { useCallback } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js"
import { Alert, AlertDescription, AlertTitle } from "@jamie-nisbet/ui"
import { useTranslations } from "next-intl"
import { Info } from "lucide-react"

import { createCheckoutSession } from "@/app/actions/checkout"
import type { Locale } from "@jamie-nisbet/app-shell/i18n"

// Load Stripe once, outside the component, to avoid recreating it on every
// render. When the publishable key is unset, there's no Stripe to load — the
// component renders a configuration notice instead of the form.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export function Checkout({
  invoiceId,
  locale,
}: {
  invoiceId: string
  locale: Locale
}) {
  const t = useTranslations("checkout")

  // Bind the session to this invoice. The Embedded Checkout provider calls this
  // with no arguments, so we close over the id + locale here. The locale is
  // forwarded to Stripe so its hosted form matches the page language.
  const fetchClientSecret = useCallback(
    () => createCheckoutSession(invoiceId, locale),
    [invoiceId, locale]
  )

  if (!stripePromise) {
    return (
      <Alert variant="info">
        <Info />
        <AlertTitle>{t("notConfiguredTitle")}</AlertTitle>
        <AlertDescription>
          {t("notConfiguredBefore")}
          <code className="font-mono text-2xs">.env</code>
          {t("notConfiguredAfter")}
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
