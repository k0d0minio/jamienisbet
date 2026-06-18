import "server-only"
import Stripe from "stripe"

// Server-side Stripe client. Constructed lazily so the app still boots (and the
// keyless demo path still renders) when STRIPE_SECRET_KEY is unset — the same
// "defer the outbound call behind an env check" pattern the sellers-site uses
// for Resend. Never import this from a client component.

let cached: Stripe | null | undefined

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached
  const key = process.env.STRIPE_SECRET_KEY
  // apiVersion is intentionally omitted: the installed SDK pins its own default,
  // which avoids a literal-version mismatch against the SDK's types.
  cached = key ? new Stripe(key) : null
  return cached
}

/** True when live Stripe calls are possible (secret key present). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

/** The public origin used to build absolute return URLs. */
export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
}
