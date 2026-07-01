import type { Metadata } from "next"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"

import { listPaymentLinks, type PaymentLinkRow } from "@/lib/finance"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"
import { PaymentLinkActions } from "@/components/payment-link-actions"
import { PaymentLinkCreateForm } from "@/components/payment-link-create-form"

export const metadata: Metadata = { title: "Payment links" }
export const dynamic = "force-dynamic"

export default async function PaymentLinksPage() {
  if (!isStripeConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Payment links</h1>
        <Alert>
          <AlertTitle>Stripe not configured</AlertTitle>
          <AlertDescription>
            Set <code>STRIPE_SECRET_KEY</code> in this environment to create shareable
            payment links here. See <code>.env.example</code>.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  let rows: PaymentLinkRow[] | null = null
  let error: string | null = null
  try {
    rows = await listPaymentLinks(30)
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach Stripe."
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Payment links</h1>

      <Card>
        <CardHeader>
          <CardTitle>New payment link</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentLinkCreateForm />
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
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 align-top">
                      <td className="px-4 py-3 font-medium">{row.productName ?? "—"}</td>
                      <td className="max-w-xs px-4 py-3">
                        <a
                          className="break-all font-mono text-xs underline underline-offset-2"
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
    </div>
  )
}
