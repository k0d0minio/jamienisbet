"use client"

import { useState, useTransition } from "react"

import { Button } from "@jamie-nisbet/ui"

import { linkClientToStripe } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// Shows a client's Stripe link: the linked customer id (with a jump to the Stripe
// dashboard) once linked, or a button to create-and-link a customer on demand.
// The invoice flow links automatically on first bill; this lets the owner do it
// ahead of time.
export function ClientStripeLink({
  id,
  stripeCustomerId,
}: {
  id: string
  stripeCustomerId: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (stripeCustomerId) {
    return (
      <div className="grid gap-1">
        <span className="font-mono text-app-footnote break-all">{stripeCustomerId}</span>
        <a
          href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
          target="_blank"
          rel="noreferrer"
          className="text-app-footnote text-app-label-3 underline underline-offset-2 hover:text-app-label"
        >
          View in Stripe ↗
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="h-auto w-full py-2 whitespace-normal sm:w-fit"
        onClick={() => {
          setError(null)
          hapticTick()
          startTransition(async () => {
            try {
              await linkClientToStripe(id)
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not link to Stripe.")
            }
          })
        }}
      >
        {pending ? "Linking…" : "Create & link Stripe customer"}
      </Button>
      {error ? <p className="text-app-footnote text-destructive">{error}</p> : null}
    </div>
  )
}
