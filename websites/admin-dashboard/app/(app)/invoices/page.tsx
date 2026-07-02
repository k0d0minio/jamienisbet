import type { Metadata } from "next"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"

import { listInvoices, type InvoiceRow } from "@/lib/finance"
import { formatEpoch } from "@/lib/format"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"
import { InvoiceActions } from "@/components/invoice-actions"
import { InvoiceCreateForm } from "@/components/invoice-create-form"
import { InvoiceStatusBadge } from "@/components/invoice-status-badge"

export const metadata: Metadata = { title: "Invoices" }
export const dynamic = "force-dynamic"

export default async function InvoicesPage() {
  if (!isStripeConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Alert>
          <AlertTitle>Stripe not configured</AlertTitle>
          <AlertDescription>
            Set <code>STRIPE_SECRET_KEY</code> in this environment to raise and send
            invoices from here. See <code>.env.example</code>.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  let rows: InvoiceRow[] | null = null
  let error: string | null = null
  try {
    rows = await listInvoices(30)
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach Stripe."
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>

      <Card>
        <CardHeader>
          <CardTitle>New invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceCreateForm />
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Stripe unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !rows || rows.length === 0 ? (
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
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatEpoch(row.createdDate)}
                      </td>
                      <td className="px-4 py-3 font-mono">{row.number ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.customerName ?? "—"}</div>
                        {row.customerEmail ? (
                          <div className="text-muted-foreground">{row.customerEmail}</div>
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
    </div>
  )
}
