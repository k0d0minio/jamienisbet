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
  countDocumentsAwaitingReview,
  getGenerationTotals,
  listClients,
  listDeals,
  type GenerationTotals,
} from "@jamie-nisbet/services"

import {
  getFinancialSummary,
  getMoneyMetrics,
  TAX_RESERVE_RATE,
  type BalanceEntry,
  type FinancialSummary,
  type MoneyMetrics,
} from "@/lib/finance"
import { formatMoney } from "@/lib/money"
import { isStripeConfigured } from "@/lib/stripe"

// DB + Stripe reads must run per request.
export const dynamic = "force-dynamic"

// Render the first non-zero per-currency balance entry, or "—".
function balanceLabel(entries: BalanceEntry[]): string {
  const first = entries.find((e) => e.amount !== 0)
  return first ? formatMoney(first.amount, first.currency) : "—"
}

// Statuses where a client is actively being worked between first contact and a
// closed outcome — the live pipeline.
const IN_PIPELINE = ["contacted", "qualified", "proposed"]

// Deal statuses whose value counts as open pipeline (not yet won or lost).
const OPEN_DEAL = ["new", "qualified", "proposed"]

export default async function DashboardPage() {
  let clientCount = 0
  let newCount = 0
  let inPipeline = 0
  let pipelineValueMinor = 0
  // Win rate: won / (won + lost). null until at least one deal has closed, so
  // the card shows an explicit "—" zero-state rather than a misleading 0%.
  let winRate: number | null = null
  let awaitingReview = 0
  let aiTotals: GenerationTotals | null = null
  let error: string | null = null

  try {
    const [clients, deals, reviewCount, totals] = await Promise.all([
      listClients(),
      listDeals(),
      countDocumentsAwaitingReview(),
      getGenerationTotals(),
    ])
    clientCount = clients.length
    newCount = clients.filter((c) => c.status === "new").length
    inPipeline = clients.filter((c) => IN_PIPELINE.includes(c.status)).length
    pipelineValueMinor = deals
      .filter((d) => OPEN_DEAL.includes(d.status))
      .reduce((sum, d) => sum + d.valueMinor, 0)
    const wonCount = deals.filter((d) => d.status === "won").length
    const closedCount = wonCount + deals.filter((d) => d.status === "lost").length
    winRate = closedCount > 0 ? wonCount / closedCount : null
    awaitingReview = reviewCount
    aiTotals = totals
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach the database."
  }

  // Stripe is fetched independently so a billing outage never hides the leads.
  let summary: FinancialSummary | null = null
  let money: MoneyMetrics | null = null
  if (isStripeConfigured()) {
    try {
      ;[summary, money] = await Promise.all([
        getFinancialSummary(),
        getMoneyMetrics(),
      ])
    } catch {
      summary = null
      money = null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Where the business stands — the five metrics (issue #27), each traced
          to its source: pipeline value + win rate from biz.deals, and monthly
          revenue / tax reserve / overdue receivables live from Stripe. Zero and
          not-configured states are explicit so a blank never reads as a real 0. */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Where the business stands
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Link href="/deals">
            <Card>
              <CardHeader>
                <CardDescription>Pipeline value</CardDescription>
                <CardTitle className="text-3xl">
                  {error
                    ? "—"
                    : pipelineValueMinor > 0
                      ? formatMoney(pipelineValueMinor, "eur")
                      : "—"}
                </CardTitle>
                <CardDescription>Open deals</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/deals">
            <Card>
              <CardHeader>
                <CardDescription>Win rate</CardDescription>
                <CardTitle className="text-3xl">
                  {!error && winRate !== null
                    ? `${Math.round(winRate * 100)}%`
                    : "—"}
                </CardTitle>
                <CardDescription>Won of closed deals</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/finances">
            <Card>
              <CardHeader>
                <CardDescription>Monthly revenue</CardDescription>
                <CardTitle className="text-3xl">
                  {money ? balanceLabel(money.monthlyRevenue) : "—"}
                </CardTitle>
                <CardDescription>Paid this month · Stripe</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/finances">
            <Card>
              <CardHeader>
                <CardDescription>Tax reserve</CardDescription>
                <CardTitle className="text-3xl">
                  {money ? balanceLabel(money.taxReserve) : "—"}
                </CardTitle>
                <CardDescription>
                  {Math.round(TAX_RESERVE_RATE * 100)}% of income · confirm w/
                  contabilista
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/invoices">
            <Card>
              <CardHeader>
                <CardDescription>Overdue receivables</CardDescription>
                <CardTitle className="text-3xl">
                  {money ? balanceLabel(money.overdueReceivables) : "—"}
                </CardTitle>
                <CardDescription>
                  {money && money.overdueCount > 0
                    ? `${money.overdueCount} overdue ${
                        money.overdueCount === 1 ? "invoice" : "invoices"
                      }`
                    : "Past due · Stripe"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
        {!isStripeConfigured() ? (
          <p className="text-xs text-muted-foreground">
            Revenue, tax reserve, and receivables need Stripe — set{" "}
            <code>STRIPE_SECRET_KEY</code> (see <code>.env.example</code>).
          </p>
        ) : null}
      </section>

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

      {/* The lead pipeline at a glance: open deal value, documents stuck at the
          review gate (the human is the bottleneck by design), and what the AI
          engine has burned. */}
      {!error ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Open pipeline value</CardDescription>
              <CardTitle className="text-3xl">
                {pipelineValueMinor > 0
                  ? formatMoney(pipelineValueMinor, "eur")
                  : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Drafts awaiting review</CardDescription>
              <CardTitle className="text-3xl">{awaitingReview}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>AI generation runs</CardDescription>
              <CardTitle className="text-3xl">{aiTotals?.runs ?? 0}</CardTitle>
              {aiTotals && aiTotals.runs > 0 ? (
                <CardDescription>
                  {Math.round(
                    (aiTotals.inputTokens + aiTotals.outputTokens) / 1000
                  )}
                  k tokens total
                </CardDescription>
              ) : null}
            </CardHeader>
          </Card>
        </div>
      ) : null}

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
