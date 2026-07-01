import "server-only"
import type Stripe from "stripe"

import { getStripe } from "@/lib/stripe"

// Read layer over Stripe for the admin. Every figure here comes straight from
// Stripe (the source of truth for money, per workspaces/finance/) — nothing is
// derived from client input. Pages call these; they render a "not configured"
// state when Stripe returns null.

export type BalanceEntry = { currency: string; amount: number } // minor units

export type FinancialSummary = {
  available: BalanceEntry[]
  pending: BalanceEntry[]
  /** Open (finalized, owing) invoices: count and total amount due, per currency. */
  openInvoiceCount: number
  outstanding: BalanceEntry[]
}

export type InvoiceRow = {
  id: string
  number: string | null
  status: Stripe.Invoice.Status
  currency: string
  total: number // minor units
  amountDue: number // minor units
  customerName: string | null
  customerEmail: string | null
  createdDate: number | null // epoch seconds
  dueDate: number | null // epoch seconds
  hostedInvoiceUrl: string | null
  /** A draft can still be edited/deleted; a finalized one can be sent/voided. */
  isDraft: boolean
}

export type PaymentRow = {
  id: string
  amount: number // minor units
  currency: string
  status: string
  description: string | null
  createdDate: number | null // epoch seconds
  receiptUrl: string | null
}

export type PaymentLinkRow = {
  id: string
  url: string
  active: boolean
  amount: number | null // minor units (null when it can't be resolved inline)
  currency: string | null
  productName: string | null
}

// ---- Financial overview ----------------------------------------------------

export async function getFinancialSummary(): Promise<FinancialSummary | null> {
  const stripe = getStripe()
  if (!stripe) return null

  const [balance, openInvoices] = await Promise.all([
    stripe.balance.retrieve(),
    stripe.invoices.list({ status: "open", limit: 100 }),
  ])

  const outstandingByCurrency = new Map<string, number>()
  for (const inv of openInvoices.data) {
    const currency = inv.currency ?? "eur"
    outstandingByCurrency.set(
      currency,
      (outstandingByCurrency.get(currency) ?? 0) + (inv.amount_due ?? 0)
    )
  }

  return {
    available: balance.available.map((b) => ({ currency: b.currency, amount: b.amount })),
    pending: balance.pending.map((b) => ({ currency: b.currency, amount: b.amount })),
    openInvoiceCount: openInvoices.data.length,
    outstanding: [...outstandingByCurrency].map(([currency, amount]) => ({
      currency,
      amount,
    })),
  }
}

// ---- Invoices --------------------------------------------------------------

function normalizeInvoice(inv: Stripe.Invoice): InvoiceRow {
  const status = inv.status ?? "draft"
  return {
    id: inv.id ?? "",
    number: inv.number ?? null,
    status,
    currency: inv.currency ?? "eur",
    total: inv.total ?? 0,
    amountDue: inv.amount_due ?? inv.total ?? 0,
    customerName: inv.customer_name ?? null,
    customerEmail: inv.customer_email ?? null,
    createdDate: inv.created ?? null,
    dueDate: inv.due_date ?? null,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    isDraft: status === "draft",
  }
}

export async function listInvoices(limit = 30): Promise<InvoiceRow[] | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const invoices = await stripe.invoices.list({ limit })
  return invoices.data.map(normalizeInvoice)
}

// ---- Recent payments -------------------------------------------------------

export async function listRecentPayments(limit = 10): Promise<PaymentRow[] | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const charges = await stripe.charges.list({ limit })
  return charges.data.map((c) => ({
    id: c.id,
    amount: c.amount,
    currency: c.currency,
    status: c.status,
    description: c.description ?? null,
    createdDate: c.created ?? null,
    receiptUrl: c.receipt_url ?? null,
  }))
}

// ---- Payment links ---------------------------------------------------------

export async function listPaymentLinks(limit = 30): Promise<PaymentLinkRow[] | null> {
  const stripe = getStripe()
  if (!stripe) return null

  // Expand the first line item's price/product so the list can show what each
  // link charges without an extra round-trip per link.
  const links = await stripe.paymentLinks.list({ limit })
  return Promise.all(
    links.data.map(async (link) => {
      let amount: number | null = null
      let currency: string | null = null
      let productName: string | null = null
      try {
        const items = await stripe.paymentLinks.listLineItems(link.id, {
          limit: 1,
          expand: ["data.price.product"],
        })
        const first = items.data[0]
        if (first?.price) {
          amount = first.price.unit_amount ?? null
          currency = first.price.currency ?? null
          const product = first.price.product
          if (product && typeof product !== "string" && !("deleted" in product)) {
            productName = product.name ?? null
          }
        }
      } catch {
        // Leave the pricing fields null if the line items can't be resolved.
      }
      return {
        id: link.id,
        url: link.url,
        active: link.active,
        amount,
        currency,
        productName,
      }
    })
  )
}
