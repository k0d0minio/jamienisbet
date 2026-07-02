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
import {
  listContactSubmissions,
  listReferralLeads,
} from "@jamie-nisbet/services"

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

export default async function DashboardPage() {
  let contactCount = 0
  let referralCount = 0
  let openReferrals = 0
  let error: string | null = null

  try {
    const [contacts, referrals] = await Promise.all([
      listContactSubmissions(),
      listReferralLeads(),
    ])
    contactCount = contacts.length
    referralCount = referrals.length
    openReferrals = referrals.filter((r) => r.status === "new").length
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
          <Link href="/leads/contact">
            <Card>
              <CardHeader>
                <CardDescription>Contact submissions</CardDescription>
                <CardTitle className="text-3xl">{contactCount}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/leads/referrals">
            <Card>
              <CardHeader>
                <CardDescription>Referral leads</CardDescription>
                <CardTitle className="text-3xl">{referralCount}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Card>
            <CardHeader>
              <CardDescription>Open referrals (new)</CardDescription>
              <CardTitle className="text-3xl">{openReferrals}</CardTitle>
            </CardHeader>
          </Card>
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
          Leads captured by the portfolio and referral forms land here. Raise and send
          invoices, share payment links, and watch your Stripe balance under Finances,
          Invoices, and Payment links.
        </CardContent>
      </Card>
    </div>
  )
}
