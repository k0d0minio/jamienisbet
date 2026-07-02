import type { Metadata } from "next"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"

import {
  getFinancialSummary,
  listRecentPayments,
  type BalanceEntry,
  type PaymentRow,
} from "@/lib/finance"
import { formatEpoch } from "@/lib/format"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = { title: "Finances" }
export const dynamic = "force-dynamic"

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

export default async function FinancesPage() {
  if (!isStripeConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Finances</h1>
        <Alert>
          <AlertTitle>Stripe not configured</AlertTitle>
          <AlertDescription>
            Set <code>STRIPE_SECRET_KEY</code> in this environment to see your Stripe
            balance, invoices, and payments here. See <code>.env.example</code>.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  let summary = null
  let payments: PaymentRow[] | null = null
  let error: string | null = null
  try {
    ;[summary, payments] = await Promise.all([
      getFinancialSummary(),
      listRecentPayments(10),
    ])
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach Stripe."
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Finances</h1>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Stripe unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : summary ? (
        <>
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

          <Card>
            <CardHeader>
              <CardTitle>Recent payments</CardTitle>
            </CardHeader>
            {payments && payments.length > 0 ? (
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
            ) : (
              <CardContent className="text-sm text-muted-foreground">
                No payments yet.
              </CardContent>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}
