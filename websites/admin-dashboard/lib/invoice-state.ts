// How an invoice reads on the Money screen.
//
// Stripe's own status is one of five words, and one of them — `open` — covers
// two situations the eye should never have to tell apart by reading a date:
// money that is owed, and money that is *late*. So the screen works in six
// states rather than five, with `overdue` split out of `open` here.
//
// Nothing is fetched or derived from Stripe by this: the split is a comparison
// between the due date Stripe already gave us and a `now` the caller samples
// once, off the render path (computing it during a render is what the
// react-hooks purity rule forbids).

export type InvoiceState =
  | "draft"
  | "open"
  | "overdue"
  | "paid"
  | "void"
  | "uncollectible"

const KNOWN: readonly string[] = [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]

/**
 * The state a row shows, from Stripe's status and its due date.
 *
 * @param status Stripe's own invoice status.
 * @param dueDate The invoice's due date in epoch *seconds*, as Stripe returns it.
 * @param nowSeconds The current time in epoch seconds, sampled by the caller.
 */
export function invoiceState(
  status: string,
  dueDate: number | null,
  nowSeconds: number
): InvoiceState {
  if (status === "open" && dueDate !== null && dueDate < nowSeconds) {
    return "overdue"
  }
  // An unrecognised status is shown as owing rather than swallowed: a word
  // nobody planned for is still news, and "open" is the honest default for
  // an invoice that is neither a draft nor settled.
  return (KNOWN.includes(status) ? status : "open") as InvoiceState
}

/** The state as it is written on a row and spoken in a sheet. */
export function invoiceStateLabel(state: InvoiceState): string {
  return state.charAt(0).toUpperCase() + state.slice(1)
}
