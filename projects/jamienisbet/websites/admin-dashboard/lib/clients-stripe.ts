import "server-only"
import type Stripe from "stripe"

import { setClientStripeCustomerId, type Client } from "@jamie-nisbet/services"

// The bridge between a Neon client row and its Stripe Customer. Neon owns the
// client's identity; Stripe owns their money. These helpers keep the two joined
// (via clients.stripe_customer_id) and the customer's contact fields in step
// with the profile — so a client picked on the invoice screen always resolves
// to one, correctly-addressed Stripe customer.

// The subset of a client we mirror onto the Stripe customer record. Typed to the
// three shared keys so it's assignable to both the create and update params
// (their fuller param types diverge on unrelated fields).
type CustomerContact = { name: string; email?: string; phone?: string }

function customerFields(client: Client): CustomerContact {
  return {
    name: client.name,
    // Stripe rejects empty strings for these; send undefined to leave unset.
    email: client.email ?? undefined,
    phone: client.phone ?? undefined,
  }
}

/**
 * Resolve the Stripe Customer for a client, creating and linking one if needed,
 * and return its id. Idempotent and safe to call before every invoice:
 *
 *   1. Already linked (and the customer still exists) → refresh its contact
 *      fields and reuse it.
 *   2. Not linked but a customer with the same email exists → adopt it (this
 *      folds in customers made by the old free-text invoice flow, which keyed
 *      on email) and persist the link.
 *   3. Otherwise → create a new customer (stamped with `client_id` metadata so
 *      Stripe events can be traced back here) and persist the link.
 *
 * The link is written back to Neon via setClientStripeCustomerId, so the next
 * call takes the fast path.
 */
export async function ensureStripeCustomer(
  stripe: Stripe,
  client: Client
): Promise<string> {
  if (client.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(client.stripeCustomerId)
      if (!existing.deleted) {
        await stripe.customers.update(client.stripeCustomerId, customerFields(client))
        return client.stripeCustomerId
      }
      // Deleted in Stripe — fall through and re-create.
    } catch {
      // Missing/unreadable — fall through and re-create.
    }
  }

  if (client.email) {
    const matches = await stripe.customers.list({ email: client.email, limit: 1 })
    const match = matches.data[0]
    if (match) {
      await setClientStripeCustomerId(client.id, match.id)
      return match.id
    }
  }

  const created = await stripe.customers.create({
    ...customerFields(client),
    metadata: { client_id: client.id },
  })
  await setClientStripeCustomerId(client.id, created.id)
  return created.id
}

/**
 * Push a client's contact details to its linked Stripe customer, best-effort.
 * Does nothing when the client isn't linked yet — editing a profile should not
 * create a Stripe customer for someone who has never been billed. Failures are
 * swallowed (logged) so a Stripe hiccup never blocks saving the profile; Neon
 * stays authoritative and the next invoice re-syncs.
 */
export async function pushClientToStripe(
  stripe: Stripe,
  client: Client
): Promise<void> {
  if (!client.stripeCustomerId) return
  try {
    await stripe.customers.update(client.stripeCustomerId, customerFields(client))
  } catch (err) {
    console.warn(
      `[clients-stripe] could not sync client ${client.id} to Stripe customer ${client.stripeCustomerId}:`,
      err
    )
  }
}
