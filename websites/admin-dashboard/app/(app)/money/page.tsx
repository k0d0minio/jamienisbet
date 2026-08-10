import type { Metadata } from "next"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { listClients } from "@jamie-nisbet/services"

import { InvoiceActions } from "@/components/invoice-actions"
import {
  InvoiceCreateForm,
  type InvoiceClientOption,
} from "@/components/invoice-create-form"
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"
import { PaymentLinkActions } from "@/components/payment-link-actions"
import { PaymentLinkCreateForm } from "@/components/payment-link-create-form"
import {
  getFinancialSummary,
  listInvoices,
  listPaymentLinks,
  listRecentPayments,
  type BalanceEntry,
  type FinancialSummary,
  type InvoiceRow,
  type PaymentLinkRow,
  type PaymentRow,
} from "@/lib/finance"
import { formatEpoch } from "@/lib/format"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = { title: "Money" }
export const dynamic = "force-dynamic"

// One screen for everything money: what's in the account, what's owed, and the
// two ways to ask for it. Every figure is read live from Stripe, which stays
// the source of truth — nothing about an amount comes from the browser.

// Render a list of per-currency balance entries as one figure per line.
function BalanceFigure({ entries }: { entries: BalanceEntry[] }) {
  const nonZero = entries.filter((e) => e.amount !== 0)
  if (nonZero.length === 0) return <CardTitle className="text-3xl">—</CardTitle>
  return (
    <div className="flex flex-col">
      {nonZero.map((e) => (
        <CardTitle key={e.currency} className="text-3xl">
          {formatMoney(e.amount, e.currency)}
        </CardTitle>
      ))}
    </div>
  )
}

function SectionHeading({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export default async function MoneyPage() {
  if (!isStripeConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Money</h1>
        <Alert>
          <AlertTitle>Stripe not configured</AlertTitle>
          <AlertDescription>
            Set <code>STRIPE_SECRET_KEY</code> in this environment to see your
            balance and raise invoices and payment links here. See{" "}
            <code>.env.example</code>.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  let summary: FinancialSummary | null = null
  let invoices: InvoiceRow[] | null = null
  let links: PaymentLinkRow[] | null = null
  let payments: PaymentRow[] | null = null
  let error: string | null = null
  try {
    ;[summary, invoices, links, payments] = await Promise.all([
      getFinancialSummary(),
      listInvoices(30),
      listPaymentLinks(30),
      listRecentPayments(10),
    ])
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach Stripe."
  }

  // Leads populate the invoice picker. A DB hiccup here shouldn't take down the
  // whole page — fall back to an empty list (the form then shows a hint).
  let clientOptions: InvoiceClientOption[] = []
  try {
    const clients = await listClients()
    clientOptions = clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.company,
    }))
  } catch {
    clientOptions = []
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Money</h1>
        <Alert variant="destructive">
          <AlertTitle>Stripe unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Money</h1>

      {/* What's in the account, and what's owed. */}
      {summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Available balance</CardDescription>
              <BalanceFigure entries={summary.available} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pending balance</CardDescription>
              <BalanceFigure entries={summary.pending} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>
                Outstanding ({summary.openInvoiceCount} open{" "}
                {summary.openInvoiceCount === 1 ? "invoice" : "invoices"})
              </CardDescription>
              <BalanceFigure entries={summary.outstanding} />
            </CardHeader>
          </Card>
        </div>
      ) : null}

      {/* Invoices — raise a draft, then finalize & send as a deliberate step. */}
      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Invoices"
          description="A new invoice is created as a draft. Emailing it is a separate, deliberate step."
        />
        <Card>
          <CardContent className="pt-6">
            <InvoiceCreateForm clients={clientOptions} />
          </CardContent>
        </Card>

        {!invoices || invoices.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No invoices yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium">Number</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Due</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((row) => (
                      <tr key={row.id} className="border-b align-top last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatEpoch(row.createdDate)}
                        </td>
                        <td className="px-4 py-3 font-mono">{row.number ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{row.customerName ?? "—"}</div>
                          {row.customerEmail ? (
                            <div className="text-muted-foreground">
                              {row.customerEmail}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <InvoiceStatusBadge status={row.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatEpoch(row.dueDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                          {formatMoney(row.amountDue, row.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <InvoiceActions
                            id={row.id}
                            isDraft={row.isDraft}
                            status={row.status}
                            hostedInvoiceUrl={row.hostedInvoiceUrl}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Payment links — a shareable, fixed-amount URL. */}
      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Payment links"
          description="A reusable link for a fixed amount — copy it and share it."
        />
        <Card>
          <CardContent className="pt-6">
            <PaymentLinkCreateForm />
          </CardContent>
        </Card>

        {!links || links.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No payment links yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Link</th>
                      <th className="px-4 py-3 font-medium">State</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((row) => (
                      <tr key={row.id} className="border-b align-top last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {row.productName ?? "—"}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <a
                            className="font-mono text-xs break-all underline underline-offset-2"
                            href={row.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.url}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.active ? "success" : "secondary"}>
                            {row.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                          {row.amount !== null && row.currency
                            ? formatMoney(row.amount, row.currency)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentLinkActions
                            id={row.id}
                            url={row.url}
                            active={row.active}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* What actually landed. */}
      <section className="flex flex-col gap-4">
        <SectionHeading title="Recent payments" />
        {!payments || payments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No payments yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatEpoch(p.createdDate)}
                        </td>
                        <td className="px-4 py-3">{p.description ?? "—"}</td>
                        <td className="px-4 py-3 capitalize">{p.status}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatMoney(p.amount, p.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.receiptUrl ? (
                            <a
                              className="underline underline-offset-2"
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
