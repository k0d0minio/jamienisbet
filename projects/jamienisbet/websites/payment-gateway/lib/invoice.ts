import "server-only"
import type Stripe from "stripe"

import { getStripe } from "@/lib/stripe"

// A small, presentation-ready view of a Stripe invoice. This is the *single
// trusted source* of the amount a client pays — the figure always comes from
// here (the real Stripe invoice), never from client input.
export type InvoiceLine = {
  description: string
  quantity: number
  unitAmount: number | null // minor units (cents)
  amount: number // minor units (cents)
}

export type InvoiceView = {
  id: string
  number: string
  currency: string
  amountDue: number // minor units (cents)
  total: number // minor units (cents)
  status: Stripe.Invoice.Status
  dueDate: number | null // epoch seconds
  createdDate: number | null // epoch seconds
  customerName: string | null
  customerEmail: string | null
  lines: InvoiceLine[]
  hostedInvoiceUrl: string | null
  /** Open and still owing — only then do we mount a payment form. */
  isPayable: boolean
}

function normalize(inv: Stripe.Invoice): InvoiceView {
  const lines: InvoiceLine[] = (inv.lines?.data ?? []).map((line) => {
    const quantity = line.quantity ?? 1
    // `price` is deprecated on newer API versions; fall back to amount/quantity.
    const unitFromPrice = (line as { price?: { unit_amount: number | null } }).price?.unit_amount
    const unitAmount =
      unitFromPrice ?? (quantity ? Math.round(line.amount / quantity) : line.amount)
    return {
      description: line.description ?? "Services",
      quantity,
      unitAmount,
      amount: line.amount,
    }
  })

  const amountDue = inv.amount_due ?? inv.total ?? 0

  return {
    id: inv.id ?? "",
    number: inv.number ?? inv.id ?? "Invoice",
    currency: inv.currency ?? "eur",
    amountDue,
    total: inv.total ?? amountDue,
    status: inv.status ?? "open",
    dueDate: inv.due_date ?? null,
    createdDate: inv.created ?? null,
    customerName: inv.customer_name ?? null,
    customerEmail: inv.customer_email ?? null,
    lines,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    isPayable: inv.status === "open" && amountDue > 0,
  }
}

/**
 * Resolve an invoice for the gateway by retrieving the real Stripe invoice.
 * Returns null when Stripe isn't configured or the id doesn't resolve — the
 * page then renders not-found.
 */
export async function getInvoice(id: string): Promise<InvoiceView | null> {
  const stripe = getStripe()
  if (!stripe) return null

  try {
    const inv = await stripe.invoices.retrieve(id)
    return normalize(inv)
  } catch {
    return null
  }
}
