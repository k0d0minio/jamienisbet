import Link from "next/link"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@jamie-nisbet/ui"
import { listClients } from "@jamie-nisbet/services"

import { getFinancialSummary, type FinancialSummary } from "@/lib/finance"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"

// DB + Stripe reads must run per request.
export const dynamic = "force-dynamic"

// Render the first non-zero per-currency balance entry, or "—".
function balanceLabel(entries: FinancialSummary["available"]): string {
  const first = entries.find((e) => e.amount !== 0)
  return first ? formatMoney(first.amount, first.currency) : "—"
}

// Statuses where a client is actively being worked between first contact and a
// closed outcome — the live pipeline.
const IN_PIPELINE = ["contacted", "qualified", "proposed"]

export default async function DashboardPage() {
  let clientCount = 0
  let newCount = 0
  let inPipeline = 0
  let error: string | null = null

  try {
    const clients = await listClients()
    clientCount = clients.length
    newCount = clients.filter((c) => c.status === "new").length
    inPipeline = clients.filter((c) => IN_PIPELINE.includes(c.status)).length
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach the database."
  }

  // Stripe is fetched independently so a billing outage never hides the leads.
  let summary: FinancialSummary | null = null
  if (isStripeConfigured()) {
    try {
      summary = await getFinancialSummary()
    } catch {
      summary = null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Database unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/clients">
            <Card>
              <CardHeader>
                <CardDescription>Clients</CardDescription>
                <CardTitle className="text-3xl">{clientCount}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/clients">
            <Card>
              <CardHeader>
                <CardDescription>New intake</CardDescription>
                <CardTitle className="text-3xl">{newCount}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/clients">
            <Card>
              <CardHeader>
                <CardDescription>In pipeline</CardDescription>
                <CardTitle className="text-3xl">{inPipeline}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      )}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/finances">
            <Card>
              <CardHeader>
                <CardDescription>Available balance</CardDescription>
                <CardTitle className="text-3xl">
                  {balanceLabel(summary.available)}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/invoices">
            <Card>
              <CardHeader>
                <CardDescription>Outstanding</CardDescription>
                <CardTitle className="text-3xl">
                  {balanceLabel(summary.outstanding)}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/invoices">
            <Card>
              <CardHeader>
                <CardDescription>Open invoices</CardDescription>
                <CardTitle className="text-3xl">{summary.openInvoiceCount}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Every portfolio and referral intake becomes a client under Clients — open one
          to work its pipeline from first contact to delivery. Raise and send invoices,
          share payment links, and watch your Stripe balance under Finances, Invoices,
          and Payment links.
        </CardContent>
      </Card>
    </div>
  )
}
