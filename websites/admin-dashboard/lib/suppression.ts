// Which of a lead's channels are closed, as the browser needs to know it.
//
// The authority is `queries/suppressions.ts` in @jamie-nisbet/services: it owns
// the table, the normalization ("Geral@Example.PT" and "geral@example.pt" are
// one opt-out) and the lookup. This module holds only the *answer* — four
// booleans, resolved on the server where the normalizer lives.
//
// The same trick as `lib/lead-facts.ts` and `lib/lead-segments.ts`: a plain
// module both a client component and a server render can import, rather than
// pulling the services barrel — and its Drizzle client and Neon driver — into
// the browser bundle to compare a string.
//
// Resolved per *value* rather than per kind, which matters for the businesses
// whose WhatsApp is a different line from their phone: closing one number does
// not close the other, and a shape keyed on "phone" alone would quietly claim
// it did.

export type SuppressedChannels = {
  /** Their email address has opted out. */
  email: boolean
  /** `clients.phone` has opted out. */
  phone: boolean
  /** The click-to-chat number has — their own WhatsApp line when they have
   *  one, and the phone number otherwise, the same rule every wa.me link in
   *  the app follows. */
  whatsapp: boolean
  /** Their Instagram handle has. */
  instagram: boolean
}

/** Nothing closed — what every surface renders for a lead nobody has opted
 *  out, and the default a caller that hasn't looked can pass. */
export const NO_SUPPRESSIONS: SuppressedChannels = {
  email: false,
  phone: false,
  whatsapp: false,
  instagram: false,
}
