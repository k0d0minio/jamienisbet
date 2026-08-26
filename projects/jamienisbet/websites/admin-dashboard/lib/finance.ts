import "server-only"
import type Stripe from "stripe"

import { getStripe } from "@/lib/stripe"

// Read layer over Stripe for the admin. Every figure here comes straight from
// Stripe (the source of truth for money) — nothing is derived from client
// input. Pages call these; they render a "not configured"
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

/**
 * The tax reserve to set aside per euro of income. Flat 30% (IRS + Segurança
 * Social; no IVA). Decision-support only: confirm with the contabilista. Kept
 * here so the admin is the one fetch path for the finance metrics.
 */
export const TAX_RESERVE_RATE = 0.3

/**
 * The five business metrics computed live from Stripe money + the biz DB, per
 * issue #27. This half (money) is Stripe-derived; the deal metrics (pipeline
 * value, win rate) are computed by the caller from `biz.deals`. Amounts are in
 * minor units, per currency, so the caller renders whichever currency Jamie
 * actually billed in without this layer guessing.
 */
export type MoneyMetrics = {
  /** Paid income for the current calendar month. */
  monthlyRevenue: BalanceEntry[]
  /** `monthlyRevenue` × {@link TAX_RESERVE_RATE}, computed per currency. */
  taxReserve: BalanceEntry[]
  /** Open, finalized invoices already past their due date. */
  overdueReceivables: BalanceEntry[]
  /** How many open invoices are overdue (drives the count on the card). */
  overdueCount: number
  /** Start of the revenue window (epoch seconds) — the source of the figure. */
  monthStart: number
}

// ---- Paginated Stripe fetches ----------------------------------------------
// Stripe pages at 100 items; the repo scripts (stripe-income/receivables.sh)
// capped there and silently under-reported once volume grew (issue #27). The
// admin uses auto-pagination so every figure covers the full result set. The
// `limit` guard is a sane ceiling, not the page size — the SDK walks pages of
// 100 up to that total.
const MAX_INVOICES = 10_000

async function listAllInvoices(
  stripe: Stripe,
  params: Stripe.InvoiceListParams
): Promise<Stripe.Invoice[]> {
  return stripe.invoices
    .list({ ...params, limit: 100 })
    .autoPagingToArray({ limit: MAX_INVOICES })
}

function sumByCurrency(
  invoices: Stripe.Invoice[],
  amount: (inv: Stripe.Invoice) => number
): BalanceEntry[] {
  const byCurrency = new Map<string, number>()
  for (const inv of invoices) {
    const currency = inv.currency ?? "eur"
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount(inv))
  }
  return [...byCurrency].map(([currency, amount]) => ({ currency, amount }))
}

// ---- Financial overview ----------------------------------------------------

export async function getFinancialSummary(): Promise<FinancialSummary | null> {
  const stripe = getStripe()
  if (!stripe) return null

  const [balance, openInvoices] = await Promise.all([
    stripe.balance.retrieve(),
    listAllInvoices(stripe, { status: "open" }),
  ])

  return {
    available: balance.available.map((b) => ({ currency: b.currency, amount: b.amount })),
    pending: balance.pending.map((b) => ({ currency: b.currency, amount: b.amount })),
    openInvoiceCount: openInvoices.length,
    outstanding: sumByCurrency(openInvoices, (inv) => inv.amount_due ?? 0),
  }
}

// ---- The five-metric money reads (issue #27) -------------------------------

export async function getMoneyMetrics(): Promise<MoneyMetrics | null> {
  const stripe = getStripe()
  if (!stripe) return null

  // The revenue window is the current calendar month (the monthly P&L
  // cadence). Boundaries in UTC so the figure is stable
  // regardless of where the server runs; Stripe's `created` filter is epoch s.
  const now = new Date()
  const monthStart = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000
  )
  const nowSec = Math.floor(now.getTime() / 1000)

  const [paidThisMonth, openInvoices] = await Promise.all([
    listAllInvoices(stripe, { status: "paid", created: { gte: monthStart } }),
    listAllInvoices(stripe, { status: "open" }),
  ])

  const monthlyRevenue = sumByCurrency(paidThisMonth, (inv) => inv.amount_paid ?? 0)
  const taxReserve = monthlyRevenue.map((e) => ({
    currency: e.currency,
    amount: Math.round(e.amount * TAX_RESERVE_RATE),
  }))

  const overdue = openInvoices.filter(
    (inv) => inv.due_date != null && inv.due_date < nowSec
  )
  const overdueReceivables = sumByCurrency(overdue, (inv) => inv.amount_due ?? 0)

  return {
    monthlyRevenue,
    taxReserve,
    overdueReceivables,
    overdueCount: overdue.length,
    monthStart,
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
